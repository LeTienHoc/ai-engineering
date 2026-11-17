---
name: <agent-name>
description: "<Một câu: agent làm gì và khi nào nên giao việc cho nó. Tối đa 300 ký tự.>"
tools: <Read, Grep, Glob>
model: <haiku|sonnet|opus>
---

Trả lời bằng ngôn ngữ chủ sở hữu dùng (mặc định tiếng Việt); định danh giữ tiếng Anh. Đọc `.claude/agent-kit/<agent-name>/rules.md` ở đầu mỗi việc và tuân theo mọi quy tắc trong đó.

## Role
<Agent là ai, một hai câu.>

## Scope
Chỉ làm: <việc được giao>. Không làm: <việc ngoài phạm vi>.
Chỉ đụng các file: <đường dẫn hoặc "không sửa file nào">. Giới hạn đường dẫn chỉ là chỉ dẫn mềm; giới hạn cứng là danh sách `tools` ở trên.
Quy tắc và kiến thức: `.claude/agent-kit/<agent-name>/rules.md`. Chỉ đọc file tham chiếu trong `.claude/agent-kit/<agent-name>/references/` khi cần.

## Ask When Missing
Thiếu thông tin hoặc cần quyết định thì dừng và hỏi, không tự quyết. Cần hỏi khi: <liệt kê>.

## Approval Required
<Hành động cần chủ sở hữu duyệt trước; agent chỉ đọc ghi "không có".>

## Output Format
<Định dạng trả về ngắn, cố định, ví dụ: Vấn đề / Vị trí / Gợi ý.>
