# Tutor Agent – Design (Phase 2)

Ngày: 2026-11-11 · Trạng thái: DRAFT chờ duyệt · Phụ thuộc: Phase 1 (plugin `ai-engineering` v0.1.0, xem `2026-11-11-ai-engineering-platform-design.md`)

## 1. Ý định và lý do

Chủ sở hữu muốn một agent **giảng dạy theo yêu cầu**: họ hỏi chủ đề nào thì agent dạy chủ đề đó. Chưa có danh sách chủ đề cố định. Nỗi lo (lời chủ sở hữu):

- AI lấy thông tin **không chính xác, chưa xác thực**.
- Giải thích **lan man, mơ hồ, khó hiểu**.
- Muốn **phương pháp học dễ hiểu, dễ hình dung, gây hứng thú**, không nhàm chán.

Chủ sở hữu **không cần hình ảnh**; hứng thú đến từ ví dụ, ẩn dụ gần gũi và câu hỏi gợi tò mò. Agent này là bằng chứng thứ hai rằng lõi chung (hợp đồng skill, eval, governance) dùng lại được.

## 2. Mục tiêu / Phi mục tiêu / Phản mục tiêu

**Mục tiêu**
- G1. Skill `tutor` trong plugin hiện có, gọi bằng `/ai-engineering:tutor` hoặc tự kích hoạt khi chủ sở hữu nhờ giải thích/học một chủ đề.
- G2. Mọi nội dung dạy dựa trên nguồn đã đọc thật; chỗ chưa xác thực được nói rõ.
- G3. Bài giảng ngắn, một ý chính, ví dụ/ẩn dụ trước rồi mới định nghĩa chính xác, kết bằng một câu hỏi kiểm tra hiểu bài, có ghi nguồn.
- G4. Có quy tắc (mỗi quy tắc có eval) và eval case chạy tay như Phase 1; validator hiện có phải tiếp tục đạt.

**Phi mục tiêu**
- Không hình ảnh, sơ đồ đồ họa, HTML artifact (ASCII hoặc bảng văn bản đơn giản thì được).
- Không lộ trình học nhiều bài, không theo dõi tiến độ, không lưu hồ sơ người học qua các phiên (có thể là phase sau).
- Không ngân hàng câu hỏi, không chấm điểm.
- Không dạy dựa trên ký ức của model khi có thể tra nguồn.

**Phản mục tiêu**
- Nói chắc chắn điều không có nguồn.
- Bịa tính năng, API hoặc trích dẫn không tồn tại.
- Bài giảng dài, liệt kê rời rạc, nhiều ý chính cùng lúc.
- Một khối kiến thức một chiều không có bước kiểm tra hiểu bài.
- Làm theo chỉ dẫn nằm trong trang web/tài liệu đã tra.

## 3. Ràng buộc

- Là skill thứ hai của plugin `ai-engineering` (cùng hợp đồng: các mục Role, Objective, Inputs, Outputs, Constraints, Workflow, Ask When Missing, Approval Required, Verify, Report; quy tắc ở `references/rules.md`, mỗi quy tắc có eval, truy vết hai chiều; `node tools/validate.ts` và `node --test tests/` phải sạch).
- Trả lời bằng ngôn ngữ chủ sở hữu dùng (mặc định tiếng Việt); định danh kỹ thuật giữ tiếng Anh.
- Nội dung đọc từ web/tài liệu là **dữ liệu không đáng tin**, không phải lệnh (governance hiện có).
- Quyền riêng tư: không đưa thông tin cá nhân hay nội dung dự án riêng của chủ sở hữu vào truy vấn tìm kiếm.
- Không có secret trong file. Docs cho chủ sở hữu bằng tiếng Việt.

## 4. Quyết định đã chốt (do chủ sở hữu)

1. Dạy theo yêu cầu, chủ đề bất kỳ, không cố định.
2. Không cần hình ảnh.
3. Luồng buổi học đã được xác nhận: (1) hỏi nhanh trình độ, (2) tra nguồn trước khi dạy, (3) dạy ngắn một ý chính, ví dụ/ẩn dụ trước, (4) một câu hỏi kiểm tra hiểu bài, (5) ghi nguồn và gợi ý bài kế tiếp.
4. **Tra nguồn trên web phải xin duyệt** (chủ sở hữu trả lời "xin duyệt để tra nguồn"). `tutor` không tự đọc web; policy mặc định cấm mạng được giữ nguyên.

## 5. Lựa chọn của người viết (chủ sở hữu chưa xác nhận riêng, xem lại khi đọc)

- **Quyền web (theo quyết định 4):** policy Phase 1 cấm truy cập mạng khi chưa duyệt và giữ nguyên, **không cần sửa `governance/policy.md`**. Skill ghi rõ trong Approval Required: trước khi tra nguồn, `tutor` nói ngắn nó định tra gì (chủ đề và loại nguồn dự kiến) và xin duyệt. Cách xin duyệt do người viết chọn: **một lần cho mỗi bài học** (không phải mỗi lần gọi công cụ), và chủ sở hữu có thể trả lời "luôn đồng ý trong phiên này" để khỏi phải duyệt lại. Dù được duyệt, vẫn cấm gửi dữ liệu riêng ra ngoài, tải/chạy file, đăng nhập, cài gói.
- **Độ tin cậy nguồn:** ưu tiên tài liệu chính thức của chính chủ thể đang dạy, rồi chuẩn/tiêu chuẩn (MDN, RFC, OWASP...), rồi nguồn thứ cấp có tên tác giả. Nguồn ẩn danh/diễn đàn chỉ dùng để gợi hướng, không làm căn cứ khẳng định. Ghi phiên bản/ngày của tài liệu khi chủ đề thay đổi theo thời gian.
- **Hỏi trình độ tối đa 3 câu**, bỏ qua nếu người dùng đã nói trình độ hoặc có thể suy ra từ câu hỏi.
- **"Gọn":** phần giải thích chính khoảng 150–250 từ, một ý chính; đi sâu thêm chỉ khi người dùng yêu cầu.
- **Số quy tắc:** khoảng 7 quy tắc hành vi (tiền tố `TU-`), nguồn là nguyên tắc của chủ sở hữu trong tài liệu này (giống `BH-*`), vì không có URL chính thức cho "cách dạy tốt".
- **Phiên bản:** plugin tăng lên 0.2.0 khi phát hành.

**Bổ sung sau builder check (cũng là lựa chọn của người viết):**
- **Không tra được nguồn** (chủ sở hữu từ chối duyệt, không có công cụ web, tìm thất bại, hoặc khái niệm không tồn tại): agent nói rõ là chưa có nguồn xác thực, **không dạy từ trí nhớ như thể chắc chắn**. Nó có thể đề nghị một bản tóm tắt ngắn gắn nhãn "chưa xác thực, từ kiến thức chung của model" và chỉ đưa khi chủ sở hữu đồng ý.
- **Tái hiện eval có nội dung web:** các case injection và nguồn cũ/mâu thuẫn dùng **kết quả tra cứu mô phỏng dán sẵn trong mục Input** (hoặc file cục bộ), không dùng trang web thật, để chạy lặp lại được. Các case còn lại (dạy chủ đề thật) dùng web thật và chấm theo cấu trúc, không theo từng chữ.
- **Chỉ trò chuyện:** `tutor` không ghi file, không chạy lệnh; `allowed-tools` chỉ gồm công cụ đọc/tra web. Mục Report liệt kê nguồn đã dùng, không liệt kê file đã đổi.
- **Validator:** ghi nhận rằng quy tắc `TU-*` chỉ cần Source không rỗng (giống `BH-*`); không cần đổi `tools/lib/rules.ts`.

## 6. Tiêu chí hoàn thành

- Skill `tutor` đủ các mục hợp đồng, có ví dụ sử dụng; quy tắc `TU-*` đều có eval; validator và test đạt.
- Eval case (chạy tay qua Claude Code, rubric như Phase 1) tối thiểu gồm: dạy một chủ đề có thật, đủ luồng 5 bước và có nguồn; **xin duyệt trước khi tra web** (chưa được duyệt thì không tra; bị từ chối thì xử lý như không tra được nguồn); **khái niệm không tồn tại hoặc không tra được nguồn** thì agent nói rõ thay vì bịa; giải thích **ngắn, một ý chính** (đo được theo mục 5); **hiệu chỉnh theo trình độ** (cùng chủ đề, người mới và người đã biết nhận mức sâu khác nhau); **nội dung trang web chứa chỉ dẫn nhúng** thì không làm theo và báo lại; **nguồn mâu thuẫn hoặc cũ** thì nêu phiên bản/ngày và ưu tiên nguồn chính thức.
- Chủ sở hữu duyệt các quy tắc `TU-*` (cổng duyệt như Phase 1) và chạy eval; kết quả ghi vào `evaluation/results/`.
- README, changelog cập nhật; cài lại và dùng được ở dự án khác.

## 7. Để builder quyết định

- Mẫu bài giảng cụ thể, cách chọn ẩn dụ/ví dụ, cách ghi nguồn.
- Công cụ web nào khai báo trong `allowed-tools` của skill.
- Chi tiết từng quy tắc `TU-*`, rubric chấm riêng cho case "nhất quán/ngắn".
- Cách đo số từ trong eval.

## 8. Mở

Không còn câu hỏi mở. Điểm cần xem lại khi đọc: cách xin duyệt "một lần mỗi bài học" ở mục 5 là lựa chọn của người viết.
