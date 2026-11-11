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

## Quyền công cụ của skill (đã xác minh 2026-11-11)
Nguồn: https://code.claude.com/docs/en/skills , https://code.claude.com/docs/en/permissions
- `allowed-tools` **cấp sẵn quyền** (không hỏi) cho các công cụ liệt kê, chỉ trong lượt gọi skill; nó **không giới hạn** công cụ nào khả dụng.
- `disallowed-tools` **gỡ** các công cụ khỏi tập khả dụng khi skill hoạt động, hết hiệu lực khi người dùng gửi tin nhắn kế tiếp. Chấp nhận chuỗi cách nhau bằng dấu cách/dấu phẩy hoặc danh sách YAML.
- Skill không đặt `allowed-tools` thì WebSearch/WebFetch vẫn theo prompt quyền thông thường (WebSearch cần duyệt; WebFetch cần duyệt trừ một tập tên miền tài liệu được duyệt sẵn).
- Chưa xác minh: chuỗi tên chính xác `WebSearch`/`WebFetch` trong `allowed-tools`; hành vi ở chế độ auto/bypass; danh sách tên miền được duyệt sẵn.

## Quyết định cho skill `tutor`
- **Không đặt `allowed-tools`** để việc tra web vẫn đi qua prompt quyền của Claude Code.
- Chat-only được ép bằng `disallowed-tools: Write Edit NotebookEdit Bash`.
- Vì WebFetch có tập tên miền duyệt sẵn (có thể không hiện prompt), bước **xin duyệt bằng lời** trong skill (TU-001) là lớp kiểm soát chính, không dựa riêng vào prompt của hệ thống.

### Hiệu chỉnh sau review (2026-11-11)
- `disallowed-tools` **chỉ có hiệu lực ở lượt gọi skill**; sang tin nhắn kế tiếp của người dùng thì công cụ khả dụng trở lại. Vì vậy "chỉ trò chuyện" của `tutor` ở các lượt sau dựa vào việc agent tuân theo chỉ dẫn (và bước Verify), không phải do nền tảng ép. Chưa chọn `context: fork` với agent riêng chỉ có công cụ web/đọc vì tốn công và chưa kiểm chứng việc xin duyệt hoạt động trong ngữ cảnh fork; có thể làm ở phase sau nếu cần bảo đảm cứng.
- Danh sách gỡ gồm `Write Edit NotebookEdit Bash PowerShell Agent Glob Grep`. Công cụ MCP không thể gỡ đáng tin cậy theo tên (chưa xác minh); `Read` vẫn khả dụng vì case `injection-in-source` cần đọc file cục bộ.
