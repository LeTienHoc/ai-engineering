import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter, type Issue } from "./lib/frontmatter.ts";
import { validateSkill } from "./lib/skill.ts";
import { validateAgent, validateAgentKit } from "./lib/agent.ts";
import { caseRules, validateEvalCase } from "./lib/evalcase.ts";
import { checkCases, checkTraceability, findUnparsedRuleHeadings, parseRules, type CaseRef, type Rule } from "./lib/rules.ts";
import { scanSecrets } from "./lib/secrets.ts";
import { parseKnownTerms } from "./lib/knownterms.ts";

// Usage: node tools/validate.ts [--agents] [path]. The root is the path argument, else VALIDATE_ROOT,
// else this repo. Unknown options and extra paths are usage errors (exit 2) so nothing is silently ignored.
const KNOWN_FLAGS = new Set(["--agents"]);
function usageError(message: string): never {
  console.error(`validate: ${message}\nusage: node tools/validate.ts [--agents] [path]`);
  process.exit(2);
}
const cliArgs = process.argv.slice(2);
for (const a of cliArgs) if (a.startsWith("-") && !KNOWN_FLAGS.has(a)) usageError(`unknown option '${a}'`);
const paths = cliArgs.filter((a) => !a.startsWith("-"));
if (paths.length > 1) usageError(`expected at most one path, got ${paths.length}`);
if (paths[0] !== undefined && !existsSync(paths[0])) usageError(`path '${paths[0]}' does not exist`);
const root = resolve(paths[0] ?? process.env.VALIDATE_ROOT ?? resolve(fileURLToPath(import.meta.url), "..", ".."));
const SKIP_DIRS = new Set([".git", "node_modules", ".superpowers"]);
const BINARY = /\.(png|jpe?g|gif|ico|webp|pdf|zip|gz|woff2?|ttf|eot|mp4|mov)$/i;
const MAX_SCAN_BYTES = 2 * 1024 * 1024;
const found: { file: string; issue: Issue }[] = [];

function report(file: string, issues: Issue[]) {
  for (const issue of issues) found.push({ file: relative(root, file), issue });
}

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const read = (f: string) => readFileSync(f, "utf8");
const rel = (f: string) => relative(root, f).replace(/\\/g, "/");

// `--agents`: check only generated agents and their kits (plus a secret scan of those files), for use on a
// target project. The root may be a project (agents in `.claude/agents`) or a `.claude` folder itself
// such as `~/.claude` (agents in `agents/`).
const agentsOnly = process.argv.includes("--agents");
const agentBase =
  agentsOnly && !existsSync(join(root, ".claude", "agents")) && !existsSync(join(root, ".claude", "agent-kit"))
    ? root
    : join(root, ".claude");
const all = agentsOnly ? [...walk(join(agentBase, "agents")), ...walk(join(agentBase, "agent-kit"))] : walk(root);

// Eval cases (any depth under evaluation/cases)
const cases: CaseRef[] = [];
for (const f of all.filter((f) => /^evaluation\/cases\/.+\.md$/.test(rel(f)))) {
  const text = read(f);
  report(f, validateEvalCase(text));
  const fm = parseFrontmatter(text);
  const id = fm?.data.id;
  if (typeof id === "string" && id) {
    if (cases.some((c) => c.id === id)) report(f, [{ code: "DUPLICATE_ID", message: `eval case id '${id}' is used more than once` }]);
    if (id !== basename(f, ".md")) report(f, [{ code: "FILENAME_ID", message: `case id '${id}' must equal its file name '${basename(f, ".md")}'` }]);
    cases.push({ id, rules: caseRules(fm.data.rules) });
  }
}

// Skills (SKILL.md in any letter case) and their rules
const allRules: Rule[] = [];
let firstRulesFile: string | null = null;
for (const f of all.filter((f) => /^skills\/[^/]+\/skill\.md$/i.test(rel(f)))) report(f, validateSkill(read(f)));
for (const f of all.filter((f) => /^skills\/[^/]+\/references\/rules\.md$/.test(rel(f)))) {
  const text = read(f);
  const rules = parseRules(text);
  firstRulesFile ??= f;
  report(f, [...findUnparsedRuleHeadings(text), ...checkTraceability(rules, cases.map((c) => c.id))]);
  allRules.push(...rules);
}
if (firstRulesFile || cases.length > 0) report(firstRulesFile ?? join(root, "evaluation", "cases"), checkCases(allRules, cases));

// Regression term list
for (const f of all.filter((f) => rel(f) === "evaluation/known-terms.md")) report(f, parseKnownTerms(read(f)).issues);

// Generated agents: .claude/agents/<name>.md with a kit in .claude/agent-kit/<name>/ (rules.md, cases/<id>.md).
// Kept in its own namespace: ids only need to be unique across the agents of this root.
{
  const relA = (f: string) => relative(agentBase, f).replace(/\\/g, "/");
  const agentFiles = all.filter((f) => /^agents\/[^/]+\.md$/.test(relA(f)));
  for (const f of all.filter((f) => /^agents\/.+\/.+\.md$/.test(relA(f)))) {
    report(f, [{ code: "NESTED_AGENT", message: "agent files must sit directly in .claude/agents/; this file was not validated" }]);
  }
  if (agentsOnly && agentFiles.length === 0) {
    report(join(agentBase, "agents"), [{ code: "NO_AGENTS", message: "--agents found no agent file in .claude/agents/ (or agents/ under a .claude root)" }]);
  }
  const agentNames = new Set(agentFiles.map((f) => basename(f, ".md")));
  const kitNames = new Set(
    all.map((f) => /^agent-kit\/([^/]+)\//.exec(relA(f))?.[1]).filter((n): n is string => !!n),
  );
  const seenCases = new Set<string>();
  const seenRules = new Set<string>();
  for (const f of agentFiles) {
    const name = basename(f, ".md");
    report(f, validateAgent(read(f), name));
    const kitDir = join(agentBase, "agent-kit", name);
    const rulesFile = join(kitDir, "rules.md");
    const caseFiles = all.filter((c) => relA(c).startsWith(`agent-kit/${name}/cases/`) && c.endsWith(".md"));
    const kitCases: CaseRef[] = [];
    const kitTypes: { id: string; type: string }[] = [];
    for (const c of caseFiles) {
      const text = read(c);
      report(c, validateEvalCase(text));
      const fm = parseFrontmatter(text);
      const id = fm?.data.id;
      if (typeof id !== "string" || !id) continue;
      if (id !== basename(c, ".md")) report(c, [{ code: "FILENAME_ID", message: `case id '${id}' must equal its file name '${basename(c, ".md")}'` }]);
      if (seenCases.has(id)) report(c, [{ code: "DUPLICATE_ID", message: `eval case id '${id}' is used more than once in this project` }]);
      seenCases.add(id);
      kitCases.push({ id, rules: caseRules(fm.data.rules) });
      kitTypes.push({ id, type: String(fm.data.type ?? "") });
    }
    const hasRules = existsSync(rulesFile);
    report(f, validateAgentKit({ name, hasRules, cases: kitTypes }));
    if (hasRules) {
      const text = read(rulesFile);
      const rules = parseRules(text);
      report(rulesFile, [...findUnparsedRuleHeadings(text), ...checkTraceability(rules, kitCases.map((c) => c.id)), ...checkCases(rules, kitCases)]);
      for (const r of rules) {
        if (seenRules.has(r.id)) report(rulesFile, [{ code: "DUPLICATE_ID", message: `rule id ${r.id} is used by more than one agent in this project` }]);
        seenRules.add(r.id);
      }
    }
  }
  for (const kit of kitNames) {
    if (!agentNames.has(kit)) {
      report(join(agentBase, "agent-kit", kit), [{ code: "KIT_WITHOUT_AGENT", message: `kit '${kit}' has no .claude/agents/${kit}.md` }]);
    }
  }
}

// Secret scan: every text file, including .env*, scripts and test fixtures
for (const f of all) {
  if (BINARY.test(f) || statSync(f).size > MAX_SCAN_BYTES) continue;
  report(f, scanSecrets(read(f)));
}

if (found.length === 0) {
  console.log("validate: OK");
} else {
  for (const { file, issue } of found) console.error(`${file}: [${issue.code}] ${issue.message}`);
  console.error(`validate: ${found.length} issue(s)`);
  process.exit(1);
}
