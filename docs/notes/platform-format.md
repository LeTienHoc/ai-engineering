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

## Ghi sổ và chạy script từ skill (đã xác minh 2026-11-11)
Nguồn: https://code.claude.com/docs/en/permissions.md , https://code.claude.com/docs/en/skills.md , https://code.claude.com/docs/en/plugins-reference.md , https://code.claude.com/docs/en/plugins/loading.md
- (a) Quy tắc quyền theo **một file** chỉ dùng được dạng `Edit(đường-dẫn)` trong `settings.json`; quy tắc `Write(đường-dẫn)` **không bao giờ khớp**. `Edit(...)` áp dụng cho mọi công cụ sửa file (kể cả Write). Cú pháp: `//c/Users/<tên>/...` là đường dẫn tuyệt đối trên Windows (ổ `C:` thành `//c/`), `~/...` là từ thư mục home (chưa xác minh trên Windows), `/...` KHÔNG phải gốc ổ đĩa. Chưa xác minh: `allowed-tools` của skill có nhận `Edit(đường-dẫn)` hay không.
- (b) `${CLAUDE_PLUGIN_ROOT}` và `${CLAUDE_SKILL_DIR}` được thay thế trong nội dung markdown của skill và trong quy tắc `Bash(...)` ở `allowed-tools`. Với plugin đã cài, `${CLAUDE_PLUGIN_ROOT}` là `~/.claude/plugins/cache/<marketplace>/<plugin>/<phiên-bản>/` (đổi theo từng phiên bản). Cách hiển thị đường dẫn trên Windows chưa xác minh.
- (c) `allowed-tools: Bash(node ${CLAUDE_PLUGIN_ROOT}/tools/quality-report.ts *)` là dạng được tài liệu cho phép; khoản cấp quyền hết hiệu lực khi người dùng gửi tin nhắn kế tiếp. Quy tắc Bash không phải ranh giới bảo mật.
- (d) Không có cơ chế "chỉ nối thêm vào file" riêng. Ghi chuyển hướng (`>>`) vẫn bị kiểm tra theo quy tắc `Edit`.

## Quyết định cho `term-feedback` và `quality-report`
- `term-feedback` **không đặt `allowed-tools`** (chưa có dạng theo đường dẫn được xác minh cho skill). Mỗi lần ghi sổ đi qua hộp thoại xin quyền thông thường, trừ khi chủ sở hữu tự thêm quy tắc `Edit(//c/Users/<tên>/.claude/ai-engineering/unknown-terms.jsonl)` vào `~/.claude/settings.json`. Tôi không tự sửa file đó; README đưa nội dung quy tắc.
- Ghi sổ bằng công cụ Read + Write (đọc file nếu có, ghi lại đúng nội dung cũ cộng một dòng). Không dùng Bash `>>` vì phải thoát ký tự JSON qua shell.
- `quality-report` cấp sẵn quyền cho đúng một lệnh: `Bash(node ${CLAUDE_PLUGIN_ROOT}/tools/quality-report.ts *)` (chỉ đọc). Nếu cách hiển thị đường dẫn trên Windows làm quy tắc không khớp thì hộp thoại xin quyền thông thường hiện ra (vẫn dùng được).
