import type { Entry } from "./ledger.ts";
import { normalizeTerm, type KnownTerm } from "./knownterms.ts";

export type CaseResult = { caseId: string; date: string; result: string };

export type ReportInput = {
  entries: Entry[];
  ledgerErrors: number;
  ledgerFound: boolean;
  knownTerms: KnownTerm[];
  caseIds: string[];
  results: CaseResult[];
  repoFound: boolean;
};

/** `evaluation/results/YYYY-MM-DD-<case-id>.md` plus its `result:` line; null when the file does not match. */
export function parseResultFile(fileName: string, text: string): CaseResult | null {
  const name = /^(\d{4}-\d{2}-\d{2})-(.+)\.md$/.exec(fileName);
  if (!name) return null;
  const line = /^result:\s*(.+?)\s*$/m.exec(text.replace(/\r\n/g, "\n"));
  if (!line) return null;
  return { caseId: name[2], date: name[1], result: line[1] };
}

function statusOf(result: string): string {
  if (/^FAIL/i.test(result)) return "RỚT";
  if (/^PASS/i.test(result)) return /informal/i.test(result) ? "đạt không chính thức" : "đạt chính thức";
  return `kết quả không rõ ("${result}")`;
}

const count = (keys: string[]): [string, number][] => {
  const map = new Map<string, number>();
  for (const k of keys) map.set(k, (map.get(k) ?? 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
};

export function buildReport(input: ReportInput): { text: string; sections: Record<string, string[]> } {
  const sections: Record<string, string[]> = {};

  const missing: string[] = [];
  if (!input.repoFound) missing.push("Không tìm thấy repo nguồn; chưa thể đọc eval case và kết quả (đã chạy `node tools/setup.ts` chưa?).");
  if (!input.ledgerFound) missing.push("Chưa có sổ từ lạ (không tìm thấy file), nên chưa có dữ liệu về từ gây khó hiểu.");
  else if (input.entries.length === 0) missing.push("Sổ từ lạ đang trống.");
  if (input.ledgerErrors > 0) missing.push(`${input.ledgerErrors} dòng trong sổ bị lỗi và đã bị bỏ qua.`);
  if (input.repoFound && input.results.length === 0) missing.push("Chưa có kết quả eval nào được ghi lại.");
  if (input.repoFound && input.knownTerms.length === 0) {
    missing.push("Danh sách thuật ngữ hồi quy đang trống: case no-unexplained-known-terms chưa chạy được.");
  }
  sections["Dữ liệu thiếu"] = missing.length > 0 ? missing : ["Không có nguồn dữ liệu nào bị thiếu."];

  const known = input.entries.filter((e) => e.agent !== "unknown");
  const unknown = input.entries.length - known.length;
  sections["Agent gây khó hiểu"] = count(known.map((e) => e.agent)).map(([agent, n]) => `${agent}: ${n}`);
  sections["Không rõ nguồn"] = [`${unknown} mục`];

  const byTerm = count(input.entries.map((e) => normalizeTerm(e.term)));
  sections["Từ lặp lại"] = byTerm.filter(([, n]) => n >= 2).map(([term, n]) => `${term}: ${n} lần`);

  const inList = new Set(input.knownTerms.map((t) => normalizeTerm(t.term)));
  sections["Từ chưa có trong danh sách hồi quy"] = byTerm.filter(([term]) => !inList.has(term)).map(([term, n]) => `${term} (${n} lần)`);

  const latest = new Map<string, CaseResult>();
  for (const r of input.results) {
    const prev = latest.get(r.caseId);
    if (!prev || r.date >= prev.date) latest.set(r.caseId, r);
  }
  sections["Eval case"] = input.caseIds.map((id) => {
    const r = latest.get(id);
    return r ? `${id}: ${statusOf(r.result)} (${r.date})` : `${id}: chưa chạy`;
  });

  const text = Object.entries(sections)
    .map(([title, lines]) => `## ${title}\n${lines.length > 0 ? lines.map((l) => `- ${l}`).join("\n") : "- (không có)"}`)
    .join("\n\n");
  return { text, sections };
}
