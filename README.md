# ai-engineering

Plugin Claude Code cá nhân để xây các AI agent nhất quán, kiểm chứng được. Phase 1 gồm: lõi chung (hợp đồng, evaluation, governance) và agent mẫu **Frontend Architect** (React/Next.js App Router + TypeScript).

Thiết kế: `docs/superpowers/specs/2026-11-11-ai-engineering-platform-design.md` · Kế hoạch: `docs/superpowers/plans/2026-11-11-ai-engineering-platform-phase1.md`

## Cấu trúc
- `core/`: nguyên tắc và các mẫu (skill, eval case, rule), nguồn sự thật duy nhất.
- `skills/frontend-architect/`: agent mẫu + `references/rules.md` (quy tắc, mỗi quy tắc có nguồn và eval).
- `evaluation/`: eval case, rubric, hướng dẫn chạy (`RUN.md`), kết quả (`results/`).
- `governance/`: chính sách quyền hạn/secret/chống injection, quy trình phiên bản.
- `tools/`, `tests/`: validator TypeScript (chạy bằng Node, không cần cài thư viện).

## Cài một lần, dùng mọi dự án
Yêu cầu: Claude Code, Node 22.18+ (đã kiểm tra với Node 26).

```
claude plugin validate D:\DuAn\ai-enginner
claude plugin marketplace add D:\DuAn\ai-enginner
claude plugin install ai-engineering@ai-engineering-local
claude plugin list
```

Thử không cần cài: `claude --plugin-dir D:\DuAn\ai-enginner`. Sau khi sửa plugin, chạy `/reload-plugins`. Skill được gọi bằng `/ai-engineering:frontend-architect` hoặc tự kích hoạt khi bạn yêu cầu việc React/Next.js.

> Lưu ý: đường dẫn tuyệt đối Windows cho `marketplace add` chưa được tài liệu xác nhận; nếu lệnh lỗi, thử `cd D:\DuAn` rồi dùng `./ai-enginner`.

## Kiểm tra trước khi commit
```
node --test tests/
node tools/validate.ts
```

## Chạy eval
Xem `evaluation/RUN.md`. Chạy tay qua Claude Code, không dùng API key.

## Giới hạn đã biết
- Quy tắc frontend đang ở trạng thái `draft`, chờ chủ sở hữu duyệt.
- Eval chạy tay; chưa gắn hook/CI. Kết quả eval phụ thuộc model nên "nhất quán" được đo bằng rubric (2/3 lần chạy).
- Chỉ phủ Next.js App Router + TypeScript; Pages Router chỉ được phát hiện và cảnh báo.
- Một người dùng; không có marketplace công khai hay dashboard.

## Báo lỗi / sửa
Khi một case FAIL hoặc agent làm sai: ghi lại tình huống thành eval case mới, sửa skill/quy tắc, chạy lại các case liên quan, thêm dòng vào `CHANGELOG.md`, rồi commit.
