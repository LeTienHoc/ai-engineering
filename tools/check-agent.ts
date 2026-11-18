// Usage: node tools/check-agent.ts <agent.md>
// Prints OK (exit 0) when the agent is proposal-only, BLOCKED (exit 1) otherwise; usage error exit 2.
import { readFileSync } from "node:fs";
import { checkAgentProposalOnly } from "./lib/verifycheck.ts";

const [file, ...rest] = process.argv.slice(2);
if (!file || rest.length > 0) {
  console.error("usage: node tools/check-agent.ts <agent.md>");
  process.exit(2);
}
let text: string;
try {
  text = readFileSync(file, "utf8");
} catch {
  console.log(`BLOCKED: cannot read ${file}`);
  process.exit(1);
}
const r = checkAgentProposalOnly(text);
console.log(`${r.ok ? "OK" : "BLOCKED"}: ${r.reason}`);
process.exit(r.ok ? 0 : 1);
