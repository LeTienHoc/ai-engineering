import { headings, parseFrontmatter, unsupportedIssues, type Issue } from "./frontmatter.ts";

export const AGENT_LIMITS = { maxBodyLines: 120, maxDescriptionChars: 300 };
export const AGENT_SECTIONS = ["Role", "Scope", "Ask When Missing", "Approval Required", "Output Format"];
export const AGENT_CASE_TYPES = ["success", "failure", "edge"];

const MODEL = /^(haiku|sonnet|opus|inherit|claude-[a-z0-9.-]+)$/;

/** Validate a generated subagent file; `fileName` is the file name without `.md`. */
export function validateAgent(text: string, fileName: string): Issue[] {
  const fm = parseFrontmatter(text);
  if (!fm) return [{ code: "NO_FRONTMATTER", message: "agent file must start with a --- frontmatter block" }];
  const issues: Issue[] = unsupportedIssues(fm);
  for (const key of ["name", "description"]) {
    if (!fm.data[key]) issues.push({ code: "MISSING_FIELD", message: `frontmatter is missing '${key}'` });
  }
  const name = fm.data.name;
  if (name && name !== fileName) {
    issues.push({ code: "NAME_MISMATCH", message: `name '${name}' must equal the file name '${fileName}'` });
  }
  const description = fm.data.description;
  if (typeof description === "string" && description.length > AGENT_LIMITS.maxDescriptionChars) {
    issues.push({
      code: "DESCRIPTION_TOO_LONG",
      message: `description is ${description.length} characters, the limit is ${AGENT_LIMITS.maxDescriptionChars}`,
    });
  }
  const tools = fm.data.tools;
  const toolList = Array.isArray(tools) ? tools : String(tools ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  if (toolList.length === 0) {
    issues.push({
      code: "MISSING_TOOLS",
      message: "frontmatter 'tools' is missing or empty; omitting 'tools' makes the agent inherit every tool, so list an explicit allowlist",
    });
  }
  const model = fm.data.model;
  if (!model) issues.push({ code: "MISSING_MODEL", message: "frontmatter is missing 'model'" });
  else if (typeof model !== "string" || !MODEL.test(model)) {
    issues.push({ code: "BAD_MODEL", message: `model '${model}' must be haiku, sonnet, opus, inherit or a claude-* model id` });
  }
  const lines = fm.body.replace(/\s+$/, "").split("\n").length;
  if (lines > AGENT_LIMITS.maxBodyLines) {
    issues.push({ code: "BODY_TOO_LONG", message: `body is ${lines} lines, the limit is ${AGENT_LIMITS.maxBodyLines}` });
  }
  const present = new Set(headings(fm.body));
  for (const section of AGENT_SECTIONS) {
    if (!present.has(section)) issues.push({ code: "MISSING_SECTION", message: `missing section '## ${section}'` });
  }
  return issues;
}

export function validateAgentKit(kit: { name: string; hasRules: boolean; cases: { id: string; type: string }[] }): Issue[] {
  const issues: Issue[] = [];
  if (!kit.hasRules) {
    issues.push({ code: "NO_KIT_RULES", message: `agent '${kit.name}' has no .claude/agent-kit/${kit.name}/rules.md` });
  }
  if (kit.cases.length < 3) {
    issues.push({ code: "TOO_FEW_CASES", message: `agent '${kit.name}' has ${kit.cases.length} eval case(s), at least 3 are required` });
  }
  const types = new Set(kit.cases.map((c) => c.type));
  for (const t of AGENT_CASE_TYPES) {
    if (!types.has(t)) issues.push({ code: "MISSING_CASE_TYPE", message: `agent '${kit.name}' has no eval case of type '${t}'` });
  }
  return issues;
}
