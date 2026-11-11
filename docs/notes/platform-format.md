# Định dạng Claude Code plugin (đã xác minh 2026-11-11)

Nguồn: code.claude.com/docs/en/plugins/manifest-reference.md, marketplace-reference.md, create-marketplace.md, install.md, create.md, skills.md

## plugin.json
- Chỉ `name` là bắt buộc (kebab-case). Nên có `version`, `description`, `author`.
- Chỉ `plugin.json` nằm trong `.claude-plugin/`; `skills/` nằm ở gốc plugin.
- Kiểm tra: `claude plugin validate <path>` (`--strict` để coi cảnh báo là lỗi).

## Skill
- Vị trí: `skills/<tên>/SKILL.md`. Frontmatter không trường nào bắt buộc, nên có `description`.
- File phụ (references/...) được phép, dẫn bằng link tương đối; SKILL.md nên < 500 dòng.
- Gọi bằng `/<plugin>:<skill>`.

## marketplace.json (local)
- Bắt buộc: `name`, `owner.name`, `plugins[]`; mỗi plugin cần `name`, `source` (chuỗi bắt đầu bằng `./`, không chứa `..`).
- Tên plugin trong marketplace phải trùng `name` trong plugin.json.

## Cài một lần, dùng mọi dự án (user scope là mặc định)
```
claude plugin validate .
claude plugin marketplace add <đường-dẫn-thư-mục>
claude plugin install ai-engineering@<tên-marketplace>
claude plugin list
```
Thử không cài: `claude --plugin-dir <thư-mục-plugin>`; sau khi sửa dùng `/reload-plugins`.

## Chưa xác minh
- Cờ `--scope user` tường minh (mặc định đã là user; đã xác nhận `scope: user`). Đã xác nhận: đường dẫn tuyệt đối dạng `D:/DuAn/...` chạy được. Còn chưa xác minh: ký tự hợp lệ của `name` trong SKILL.md. Kiểm tra bằng thực tế ở Task 8.
