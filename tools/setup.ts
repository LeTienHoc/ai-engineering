import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const i = process.argv.indexOf("--home");
const home = resolve((i >= 0 ? process.argv[i + 1] : undefined) ?? process.env.AI_ENGINEERING_HOME ?? join(homedir(), ".claude", "ai-engineering"));
const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..").replace(/\\/g, "/");

if (!existsSync(home)) mkdirSync(home, { recursive: true });
writeFileSync(join(home, "config.json"), JSON.stringify({ repo }, null, 2) + "\n");
console.log(`Đã ghi ${join(home, "config.json")} với repo nguồn: ${repo}`);
