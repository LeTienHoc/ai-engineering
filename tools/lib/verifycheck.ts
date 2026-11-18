import { parseFrontmatter } from "./frontmatter.ts";

/**
 * Result of a safety check. `checked` lists the tool or script names examined, in order.
 * `buildOutput` (scripts only): the script builds output files (a build or `tsc` without `--noEmit`),
 * so it may be proposed only for an "it builds" claim, naming the folder it writes.
 */
export type CheckResult = { ok: boolean; reason: string; checked: string[]; buildOutput?: boolean };

/** Tools that let an agent change files or run commands (documentation; the check below is an allowlist). */
export const WRITE_TOOLS = ["Edit", "Write", "NotebookEdit", "Bash", "PowerShell"];
/** The only tools a proposal-only worker may have. Anything else (including Agent, Task, MCP tools, `*`) is blocked. */
export const READ_ONLY_TOOLS = ["Read", "Grep", "Glob", "WebFetch", "WebSearch", "TodoWrite"];

function agentToolNames(agentText: string): string[] {
  const fm = parseFrontmatter(agentText);
  let raw: string | string[] | undefined = fm?.data.tools;
  if (fm?.unsupported.includes("tools") || raw === "" || raw === undefined) {
    // YAML block list: "tools:\n  - Read\n  - Grep"
    const block = /^tools:[ \t]*\n((?:[ \t]+-[ \t]*.+(?:\n|$))+)/m.exec(agentText.replace(/\r\n/g, "\n"));
    if (block) raw = block[1].split("\n").map((l) => l.replace(/^[ \t]+-[ \t]*/, ""));
  }
  const text = Array.isArray(raw) ? raw.join(",") : (raw ?? "");
  return text
    .replace(/\([^)]*\)/g, "") // Bash(git:*) -> Bash: a permission pattern does not make a tool safe
    .replace(/[[\]"']/g, " ")
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Is this agent file proposal-only: it declares tools, and every one is a known read-only tool? */
export function checkAgentProposalOnly(agentText: string): CheckResult {
  const list = agentToolNames(agentText);
  if (list.length === 0) return { ok: false, reason: "agent declares no tools, so it gets every tool", checked: [] };
  const allowed = new Set(READ_ONLY_TOOLS.map((t) => t.toLowerCase()));
  const bad = list.filter((t) => !allowed.has(t.toLowerCase()));
  if (bad.length > 0) {
    return { ok: false, reason: `agent has tools that are not known read-only tools (may write, run commands or spawn agents): ${bad.join(", ")}`, checked: list };
  }
  return { ok: true, reason: `tools are read-only: ${list.join(", ")}`, checked: list };
}

/** Patterns that mean a script writes, deletes, installs, migrates, deploys or goes to the network. */
const WRITE_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /--fix(?![-\w])/, label: "--fix" },
  { re: /(^|\s)(-u|--update|--updateSnapshot|--update-snapshots)(?=[\s=]|$)/, label: "snapshot update" },
  { re: /(^|\s)(--write|-w|--apply)(?=[\s=]|$)/, label: "--write/--apply" },
  { re: /\b(rm|rimraf|del|rd|rmdir)\b/, label: "delete" },
  { re: /\b(install|uninstall)\b|\b(npm|yarn|pnpm)\s+(i|ci|add|remove)\b/, label: "install/uninstall" },
  { re: /\bgit\s+(checkout|reset|clean|commit|stash|restore|switch|merge|rebase|tag|add|rm|mv|apply|am|cherry-pick|pull|fetch|clone)\b/, label: "git command that changes things" },
  { re: /\bsed\b[^&|;]*\s-i/, label: "sed -i" },
  { re: /\b(cp|mv|tee|touch|mkdir|chmod|ln)\b/, label: "file write" },
  { re: /\b(node|tsx|ts-node)\s+(?:-\S+\s+)*[^\s-]\S*\.[cm]?[jt]s\b/, label: "runs a script file whose effects cannot be read" },
  { re: /\bmigrate\b/, label: "migrate" },
  { re: /\bdeploy\b/, label: "deploy" },
  { re: /\b(push|publish)\b/, label: "push/publish" },
  { re: /\b(curl|wget)\b/, label: "network" },
  { re: />(?!&)/, label: "output redirection (>)" },
];
const MAX_DEPTH = 5;
const NPM_SCRIPT_ALIASES: Record<string, string> = { test: "test", t: "test", tst: "test", start: "start", stop: "stop", restart: "restart" };
const RUNNERS = new Set(["run-s", "run-p", "npm-run-all"]);

/** Is `npm run <scriptName>` free of known write patterns, including its pre/post hooks and every script it calls? */
export function checkScript(packageJsonText: string, scriptName: string): CheckResult {
  let scripts: Record<string, unknown>;
  try {
    const parsed = JSON.parse(packageJsonText);
    scripts = parsed && typeof parsed.scripts === "object" && parsed.scripts ? parsed.scripts : {};
  } catch {
    return { ok: false, reason: "package.json is not valid JSON", checked: [] };
  }
  const has = (n: string) => Object.prototype.hasOwnProperty.call(scripts, n) && typeof scripts[n] === "string";
  if (!has(scriptName)) return { ok: false, reason: `script '${scriptName}' not found in package.json`, checked: [] };
  const checked: string[] = [];
  const visited = new Set<string>();
  let buildOutput = false;

  const expand = (pattern: string): string[] => {
    if (!pattern.includes("*")) return [pattern];
    const re = new RegExp("^" + pattern.split("*").map((p) => p.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$");
    return Object.keys(scripts).filter((k) => re.test(k));
  };
  const visitAll = (names: string[], depth: number, how: string): string | null => {
    if (names.length === 0) return `cannot resolve '${how}' to a script in package.json`;
    for (const n of names) {
      if (!has(n)) return `cannot resolve '${how}' to a script in package.json`;
      const p = visit(n, depth);
      if (p) return p;
    }
    return null;
  };

  const checkCommand = (cmd: string, depth: number): string | null => {
    let tokens = cmd.trim().split(/\s+/).filter(Boolean);
    while (tokens.length && (/^\w+=/.test(tokens[0]) || tokens[0] === "cross-env")) tokens = tokens.slice(1);
    if (tokens.length === 0) return null;
    const [tool, ...rest] = tokens;
    const words = rest.filter((t) => !t.startsWith("-"));
    if (RUNNERS.has(tool)) return visitAll(words.flatMap(expand), depth + 1, cmd.trim());
    if (tool === "npm" || tool === "yarn" || tool === "pnpm") {
      const sub = words[0];
      if (sub === undefined) return null;
      if (sub === "run" || sub === "run-script") return visitAll(words[1] ? expand(words[1]) : [], depth + 1, cmd.trim());
      if (sub === "exec" || sub === "x" || sub === "dlx") return null; // a binary: its text was already pattern-checked
      if (tool === "npm" && NPM_SCRIPT_ALIASES[sub]) return visitAll([NPM_SCRIPT_ALIASES[sub]], depth + 1, cmd.trim());
      if (tool !== "npm" && has(sub)) return visitAll([sub], depth + 1, cmd.trim());
      return `cannot resolve '${cmd.trim()}' to a script in package.json`;
    }
    return null;
  };

  const checkBody = (body: string, depth: number): string | null => {
    const hit = WRITE_PATTERNS.find((p) => p.re.test(body));
    if (hit) return `looks like it changes things (${hit.label}): ${body}`;
    if ((/\btsc\b/.test(body) && !/--noEmit\b/.test(body)) || /\bbuild\b/.test(body)) buildOutput = true;
    // concurrently "npm:lint" "npm run test": quoted arguments are scripts or commands of their own
    const quoted = [...body.matchAll(/"([^"]*)"|'([^']*)'/g)].map((m) => m[1] ?? m[2]);
    for (const q of quoted) {
      const p = q.startsWith("npm:") ? visitAll(expand(q.slice(4)), depth + 1, q) : checkBody(q, depth);
      if (p) return p;
    }
    const unquoted = body.replace(/"[^"]*"|'[^']*'/g, " ");
    for (const cmd of unquoted.split(/&&|\|\||;|\|/)) {
      const p = checkCommand(cmd, depth);
      if (p) return p;
    }
    return null;
  };

  const visit = (name: string, depth: number): string | null => {
    if (visited.has(name)) return null;
    if (depth > MAX_DEPTH) return `script nesting is deeper than ${MAX_DEPTH} levels, not checked: '${name}'`;
    visited.add(name);
    for (const part of [`pre${name}`, name, `post${name}`]) {
      if (!has(part)) continue;
      checked.push(part);
      const p = checkBody(scripts[part] as string, depth);
      if (p) return `script '${part}': ${p}`;
    }
    return null;
  };

  const problem = visit(scriptName, 0);
  if (problem) return { ok: false, reason: problem, checked, buildOutput };
  const note = buildOutput ? "; it writes build output, so propose it only for an \"it builds\" claim and name the folder it writes" : "";
  return { ok: true, reason: `no known write pattern found in: ${checked.join(", ")}${note}`, checked, buildOutput };
}
