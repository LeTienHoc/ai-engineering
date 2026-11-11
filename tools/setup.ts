import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const i = process.argv.indexOf("--home");
if (i >= 0 && (process.argv[i + 1] === undefined || process.argv[i + 1].startsWith("--"))) {
  console.error("Tùy chọn --home cần một giá trị (ví dụ --home <thư mục>).");
  process.exit(2);
}
const home = resolve((i >= 0 ? process.argv[i + 1] : undefined) ?? process.env.AI_ENGINEERING_HOME ?? join(homedir(), ".claude", "ai-engineering"));
const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..").replace(/\\/g, "/");

// The installed plugin is a per-version snapshot; recording it would make the report read stale data.
if (/\/plugins\/cache\//.test(repo)) {
  console.error(`Đây là bản chụp của plugin đã cài (${repo}), không phải repo nguồn. Hãy chạy lệnh này từ thư mục repo nguồn của bạn.`);
  process.exit(1);
}

const configFile = join(home, "config.json");
let previous: string | undefined;
if (existsSync(configFile)) {
  try {
    previous = JSON.parse(readFileSync(configFile, "utf8").replace(/^﻿/, "")).repo;
  } catch {
    previous = undefined;
  }
}

if (!existsSync(home)) mkdirSync(home, { recursive: true });
writeFileSync(configFile, JSON.stringify({ repo }, null, 2) + "\n");
console.log(`Đã ghi ${configFile} với repo nguồn: ${repo}`);
if (previous && previous !== repo) console.log(`Lưu ý: đã thay repo nguồn cũ (${previous}) bằng repo này.`);
