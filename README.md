# ai-engineering

Plugin Claude Code cá nhân để xây các AI agent nhất quán, kiểm chứng được. Gồm: lõi chung (hợp đồng, evaluation, governance) và hai agent:
- **Frontend Architect** (`/ai-engineering:frontend-architect`): làm việc React/Next.js App Router + TypeScript theo quy tắc cố định, hỏi khi thiếu thông tin, kiểm tra trước khi báo xong.
- **Tutor** (`/ai-engineering:tutor`): dạy bất kỳ chủ đề nào bạn hỏi, mỗi bài một ý chính, có ví dụ trước, có câu hỏi kiểm tra hiểu bài và ghi nguồn. **Xin duyệt trước khi tra web**; không có nguồn xác thực thì nói thẳng, không dạy từ trí nhớ như thể chắc chắn. Chỉ trò chuyện, không ghi file, không nhớ giữa các phiên.

Thiết kế: `docs/superpowers/specs/` · Kế hoạch: `docs/superpowers/plans/` (Phase 1: lõi + Frontend Architect; Phase 2: Tutor)

## Cấu trúc
- `core/`: nguyên tắc và các mẫu (skill, eval case, rule), nguồn sự thật duy nhất.
- `skills/frontend-architect/`, `skills/tutor/`: mỗi agent có `SKILL.md` + `references/rules.md` (quy tắc, mỗi quy tắc có nguồn và eval).
- `evaluation/`: eval case, rubric, hướng dẫn chạy (`RUN.md`), kết quả (`results/`).
- `governance/`: chính sách quyền hạn/secret/chống injection, quy trình phiên bản.
- `tools/`, `tests/`: validator TypeScript (chạy bằng Node, không cần cài thư viện).

## Cài một lần, dùng mọi dự án
Yêu cầu: Claude Code, Node 22.18+ (đã kiểm tra với Node 26).

```
claude plugin validate D:\DuAn\ai-enginner
claude plugin marketplace add D:/DuAn/ai-enginner
claude plugin install ai-engineering@ai-engineering-local
claude plugin list
```

Thử không cần cài: `claude --plugin-dir D:\DuAn\ai-enginner`. Sau khi sửa plugin, chạy `/reload-plugins`. Skill được gọi bằng `/ai-engineering:frontend-architect` hoặc tự kích hoạt khi bạn yêu cầu việc React/Next.js.

> Đã kiểm tra ngày 2026-11-11 trên Windows: `marketplace add` với đường dẫn tuyệt đối dùng dấu `/` (`D:/DuAn/ai-enginner`) cài thành công ở user scope (`claude plugin list` hiển thị `Scope: user`, enabled).

## Kiểm tra trước khi commit
```
node --test tests/
node tools/validate.ts
```

## Chạy eval
Xem `evaluation/RUN.md`. Chạy tay qua Claude Code, không dùng API key.

## Giới hạn đã biết
- Bộ quy tắc frontend đã được chủ sở hữu duyệt (2026-11-11); quy tắc mới hoặc sửa đổi bắt đầu ở `draft` cho đến khi được duyệt.
- Eval chạy tay; chưa gắn hook/CI. Kết quả eval phụ thuộc model nên "nhất quán" được đo bằng rubric (2/3 lần chạy).
- Chỉ phủ Next.js App Router + TypeScript; Pages Router chỉ được phát hiện và cảnh báo.
- Một người dùng; không có marketplace công khai hay dashboard.

## Báo lỗi / sửa
Khi một case FAIL hoặc agent làm sai: ghi lại tình huống thành eval case mới, sửa skill/quy tắc, chạy lại các case liên quan, thêm dòng vào `CHANGELOG.md`, rồi commit.
