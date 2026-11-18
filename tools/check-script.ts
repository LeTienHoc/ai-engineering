// Usage: node tools/check-script.ts <package.json> <script>
// Prints OK (exit 0) when the script, its pre/post hooks and nested scripts look check-only,
// BLOCKED (exit 1) otherwise; usage error exit 2.
import { readFileSync } from "node:fs";
import { checkScript } from "./lib/verifycheck.ts";

const [file, script, ...rest] = process.argv.slice(2);
if (!file || !script || rest.length > 0) {
  console.error("usage: node tools/check-script.ts <package.json> <script>");
  process.exit(2);
}
let text: string;
try {
  text = readFileSync(file, "utf8");
} catch {
  console.log(`BLOCKED: cannot read ${file}`);
  process.exit(1);
}
const r = checkScript(text, script);
console.log(`${r.ok ? "OK" : "BLOCKED"}: ${r.reason}`);
process.exit(r.ok ? 0 : 1);
