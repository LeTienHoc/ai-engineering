import { parseFrontmatter } from "./frontmatter.ts";

/** Result of a safety check. `checked` lists the tool or script names examined, in order. */
export type CheckResult = { ok: boolean; reason: string; checked: string[] };

/** Tools that let an agent change files or run commands. */
export const WRITE_TOOLS = ["Edit", "Write", "NotebookEdit", "Bash", "PowerShell"];
/** A worker must also not spawn other agents (it could delegate to a writer). */
const FORBIDDEN_WORKER_TOOLS = [...WRITE_TOOLS, "Agent"];

/** Is this agent file proposal-only (declares tools, none of which can write, run commands or spawn agents)? */
export function checkAgentProposalOnly(agentText: string): CheckResult {
  const fm = parseFrontmatter(agentText);
  const raw = fm?.data.tools;
  const list = (Array.isArray(raw) ? raw : typeof raw === "string" ? raw.replace(/^\[|\]$/g, "").split(",") : [])
    .map((t) => t.trim())
    .filter(Boolean);
  if (list.length === 0) return { ok: false, reason: "agent declares no tools, so it gets every tool", checked: [] };
  const bad = list.filter((t) => FORBIDDEN_WORKER_TOOLS.some((f) => f.toLowerCase() === t.toLowerCase()));
  if (bad.length > 0) return { ok: false, reason: `agent has tools that can write, run commands or spawn agents: ${bad.join(", ")}`, checked: list };
  return { ok: true, reason: `tools are read-only: ${list.join(", ")}`, checked: list };
}

/** Patterns that mean a script writes, deletes, installs, migrates, deploys or goes to the network. */
const WRITE_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /--fix\b/, label: "--fix" },
  { re: /(^|\s)(-u|--updateSnapshot)(?=\s|$)/, label: "-u (snapshot update)" },
  { re: /\b(rm|rimraf|del|rd|rmdir)\b/, label: "delete" },
  { re: /\b(npm|yarn|pnpm)\s+(install|i|ci|add|uninstall|remove)\b/, label: "install/uninstall" },
  { re: /\bmigrate\b/, label: "migrate" },
  { re: /\bdeploy\b/, label: "deploy" },
  { re: /\b(push|publish)\b/, label: "push/publish" },
  { re: /\b(curl|wget)\b/, label: "network" },
  { re: />(?!&)/, label: "output redirection (>)" },
];
const NESTED = /\b(?:npm\s+run|pnpm\s+run|yarn\s+run|yarn|pnpm)\s+([\w:.-]+)/g;
const MAX_DEPTH = 5;

/** Is `npm run <scriptName>` check-only, including its pre/post hooks and the scripts it calls? */
export function checkScript(packageJsonText: string, scriptName: string): CheckResult {
  let scripts: Record<string, unknown>;
  try {
    scripts = (JSON.parse(packageJsonText)?.scripts ?? {}) as Record<string, unknown>;
  } catch {
    return { ok: false, reason: "package.json is not valid JSON", checked: [] };
  }
  if (typeof scripts[scriptName] !== "string") return { ok: false, reason: `script '${scriptName}' not found in package.json`, checked: [] };
  const checked: string[] = [];
  const visited = new Set<string>();
  const visit = (name: string, depth: number): string | null => {
    if (visited.has(name) || depth > MAX_DEPTH) return null;
    visited.add(name);
    for (const part of [`pre${name}`, name, `post${name}`]) {
      const body = scripts[part];
      if (typeof body !== "string") continue;
      checked.push(part);
      const hit = WRITE_PATTERNS.find((p) => p.re.test(body));
      if (hit) return `script '${part}' looks like it changes things (${hit.label}): ${body}`;
      for (const m of body.matchAll(NESTED)) {
        if (typeof scripts[m[1]] !== "string") continue;
        const found = visit(m[1], depth + 1);
        if (found) return found;
      }
    }
    return null;
  };
  const problem = visit(scriptName, 0);
  if (problem) return { ok: false, reason: problem, checked };
  return { ok: true, reason: `check-only: ${checked.join(", ")}`, checked };
}
