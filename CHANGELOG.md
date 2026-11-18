# Changelog

## 0.4.0 - (chưa phát hành)
- Bộ não bản 1, skill `agent-builder`: hỏi phần thiếu, đề xuất thiết kế, chỉ ghi file sau khi duyệt và sau khi liệt kê file, không ghi đè; sinh **subagent** (`.claude/agents/<tên>.md`) kèm bộ `.claude/agent-kit/<tên>/` (quy tắc, eval). Quy tắc AB-001..AB-010 (chủ sở hữu duyệt 2026-11-18) và 8 eval case `builder-*` (chưa chạy).
- Validator: mô-đun `tools/lib/agent.ts` (ngân sách token: thân ≤ 120 dòng, `description` ≤ 300 ký tự, bắt buộc `tools`, `model`, 5 mục) và chế độ kiểm tra dự án đích qua đường dẫn tham số (`validate.ts --agents "<dự án>"`) hoặc `VALIDATE_ROOT`; tùy chọn lạ, đường dẫn thứ hai hoặc đường dẫn không tồn tại báo lỗi mã 2 thay vì bị lờ đi (KIT_WITHOUT_AGENT, NO_KIT_RULES, TOO_FEW_CASES, MISSING_CASE_TYPE, trùng id trong cùng dự án, NESTED_AGENT); cờ `--agents` chỉ kiểm tra agent sinh ra, chạy được với cả dự án lẫn `~/.claude`, báo NO_AGENTS khi không tìm thấy agent nào. Skill gọi validator qua `${CLAUDE_PLUGIN_ROOT}` để dùng được ở dự án khác (sửa sau review độc lập). Mẫu `core/templates/agent.template.md`.
- Agent mẫu `examples/code-optimizer/` (chỉ đọc, gợi ý tối ưu code, quy tắc CO-001..CO-006 draft): tạo trong phiên bằng cách làm theo `agent-builder`, chưa qua lần chạy skill thật, chủ sở hữu chưa thử trên dự án thật.
- Bản này gồm cả phần Phase 3B bên dưới (trước ghi là 0.3.0, chưa từng phát hành); quy tắc 3B vẫn draft, coi là thử nghiệm.

### Phần Phase 3B (trước ghi là 0.3.0)
- Theo dõi chất lượng theo thước đo "hiểu được": skill `term-feedback` (giải thích từ lạ và ghi sổ dùng chung `~/.claude/ai-engineering/unknown-terms.jsonl`), skill `quality-report` (báo cáo chỉ đọc, nói rõ dữ liệu thiếu), `tools/setup.ts`, danh sách hồi quy `evaluation/known-terms.md`, quy tắc TF-001..TF-005, QR-001..QR-003, BH-004 (draft, chờ duyệt) và 6 eval case; TU-006 quay về draft vì danh sách eval thêm `no-unexplained-known-terms`.

## 0.2.1 - 2026-11-11 (0.2.0 chỉ là bản cài thử nội bộ, chưa gắn tag)
- Skill `tutor`: dạy theo yêu cầu, xin duyệt trước khi tra web, nguồn có xác thực, bài ngắn một ý chính, có câu hỏi kiểm tra; 8 quy tắc TU-001..TU-008 (đã được chủ sở hữu duyệt 2026-11-11) và 10 eval case; test kiểm tra cả repo. Sau review độc lập: làm rõ định nghĩa "bài học" cho việc duyệt, giới hạn khi đã được duyệt, mô tả trigger hẹp hơn, gỡ thêm công cụ (PowerShell, Agent, Glob, Grep), ghi rõ `disallowed-tools` chỉ có hiệu lực ở lượt đầu, case injection dùng file cục bộ, thêm case duyệt chủ đề mới và rò rỉ dữ liệu riêng trong truy vấn.

- Kết quả eval: mới ghi 1 bản ghi không chính thức (chủ sở hữu tự thử kiểu dạy cho người mới). Các eval case còn lại của `tutor` và `frontend-architect` chưa có kết quả ghi lại.

## 0.1.0 - 2026-11-11
- Khung plugin, validator (skill, eval, truy vết quy tắc, quét secret), core, governance.
- Skill `frontend-architect` với quy tắc FE-001..FE-009 và BH-001..BH-003 (đã được chủ sở hữu duyệt 2026-11-11), 8 eval case, rubric, hướng dẫn chạy, README.
- Sau review độc lập: truy vết hai chiều rule ↔ case (UNKNOWN_RULE, TRACE_MISMATCH, ORPHAN_CASE, FILENAME_ID); phát hiện heading quy tắc không đọc được; kiểm tra Status/Source; chịu được BOM; từ chối YAML dạng block/đa dòng; quét secret mọi file (kể cả `.env*`) với mẫu chính xác hơn; làm rõ rubric, quy tắc hỏi-hay-giả-định và chính sách `.env`; thêm FE-008 (đặt tên), FE-009 (kiểm tra input/phân quyền).
