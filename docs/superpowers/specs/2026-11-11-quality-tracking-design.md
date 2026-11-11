# Quality Tracking (Phase 3, hướng B) – Design

Ngày: 2026-11-11 · Trạng thái: DRAFT chờ duyệt · Phụ thuộc: Phase 1-2 (plugin `ai-engineering` v0.2.1)

## 1. Ý định và lý do

Hiện chưa có cách nào biết các agent đang tốt hay không: `evaluation/results/` gần như trống. Chủ sở hữu mô tả thước đo thật của mình (lời chủ sở hữu): một agent "ổn" khi **đọc xong và hiểu** nó hướng dẫn gì; điều gây phiền là agent **ghi ra một khái niệm mà họ nhìn vào không biết là gì**. Chủ sở hữu sẽ báo thẳng trong khung chat khi gặp từ lạ.

Vì vậy "theo dõi chất lượng" ở đây tập trung vào **khả năng hiểu được**, không chỉ pass/fail của eval: ghi lại từ lạ, biến chúng thành kiểm thử hồi quy, và có báo cáo tổng hợp.

## 2. Mục tiêu / Phi mục tiêu / Phản mục tiêu

**Mục tiêu**
- G1. Khi chủ sở hữu hỏi nghĩa một từ trong chat ("X là gì?", "tôi không hiểu từ này"), agent giải thích bằng lời thường **và** ghi từ đó vào một sổ từ lạ.
- G2. Một case hồi quy duy nhất `no-unexplained-known-terms`, đọc danh sách từ lạ đã biết từ một file trong repo; agent dùng lại từ trong danh sách mà chưa giải thích thì rớt.
- G3. Một báo cáo chất lượng (đọc-only, gọi khi cần): agent nào gây khó hiểu nhiều nhất, từ nào lặp lại, từ nào chưa có trong danh sách hồi quy, eval case nào chưa từng được chạy hoặc đang FAIL.
- G4. Một nguyên tắc chung cho mọi agent: khi chưa biết trình độ người dùng, thuật ngữ lần đầu xuất hiện phải được giải thích ngay. `tutor` đã có (TU-006); `frontend-architect` nhận thêm quy tắc tương ứng.
- G5. Mọi phần mới tuân theo khung Phase 1 (hợp đồng, quy tắc có eval, validator, truy vết hai chiều).

**Phi mục tiêu**
- Không dashboard hay giao diện (hướng C để sau).
- Không tự phát hiện từ lạ; chỉ ghi khi chủ sở hữu báo.
- Không gửi dữ liệu ra ngoài máy; không đồng bộ đám mây.
- Không mỗi-từ-một-eval-case; không ghi loại phản hồi khác ngoài từ lạ (phase sau nếu cần).
- Không sửa nội dung bài giảng tự động dựa trên sổ.

**Phản mục tiêu**
- Sổ chứa bí mật, đường dẫn hay nội dung riêng của dự án chủ sở hữu.
- Agent ghi sổ mà không giải thích từ (hoặc giải thích rồi quên ghi).
- Báo cáo nói "tốt" khi dữ liệu thiếu (ví dụ case chưa chạy bị tính là đạt).
- Việc ghi sổ làm cản trở trải nghiệm hỏi đáp (hỏi xin duyệt mỗi lần).

## 3. Ràng buộc

- Thêm hai skill vào plugin hiện có: `term-feedback` (ghi sổ) và `quality-report` (báo cáo, chỉ đọc). Cùng hợp đồng skill của Phase 1.
- Sổ nằm ở **một file cố định ở mức người dùng**, dùng chung mọi dự án (plugin chạy ở nhiều dự án). Đường dẫn dự kiến: `~/.claude/ai-engineering/unknown-terms.jsonl`.
- Quyền ghi: `term-feedback` chỉ được **thêm dòng vào đúng file sổ đó**; mọi ghi khác theo `governance/policy.md` (xin duyệt). Việc thêm ngoại lệ hẹp này vào policy cần chủ sở hữu duyệt (xem mục 6).
- Mỗi mục sổ gồm: ngày, từ, agent/skill đã dùng từ đó, chủ đề, câu nơi từ xuất hiện (chỉ trích từ chính câu trả lời của agent), nghĩa ngắn. **Không** chứa bí mật, đường dẫn, tên dự án hay dữ liệu riêng của chủ sở hữu.
- Báo cáo phải đọc **dữ liệu sống** (eval case và kết quả trong repo nguồn), không đọc bản chụp trong cache cài đặt của plugin.
- Validator (`node tools/validate.ts`) và `node --test tests/` phải sạch; công cụ viết bằng TypeScript chạy bằng Node, không thêm thư viện.
- Docs cho chủ sở hữu bằng tiếng Việt; định danh kỹ thuật tiếng Anh. Không bỏ qua cổng duyệt quy tắc (quy tắc mới `draft` đến khi chủ sở hữu duyệt).

## 4. Quyết định đã chốt (do chủ sở hữu)

1. Thước đo chất lượng là "hiểu được"; nỗi phiền là từ lạ không giải thích.
2. Báo từ lạ bằng cách **nói thẳng trong chat**.
3. Mô tả 5 phần ở mục 1-2 đã được duyệt trong hội thoại (ghi sổ, sổ dùng chung, một case hồi quy, báo cáo khi gọi, nguyên tắc chung).
4. Chủ sở hữu duyệt bản thiết kế sau khi được hỏi về **ngoại lệ ghi sổ hẹp** ở mục 8; người viết hiểu "duyệt" là đồng ý cả ngoại lệ đó (nếu hiểu sai, chủ sở hữu báo và chuyển sang phương án hộp thoại xin quyền ở mục 5).

## 5. Lựa chọn của người viết (chủ sở hữu chưa xác nhận riêng)

- **Tách thành hai skill nhỏ** vì `tutor` bị cấm ghi file và báo cáo chỉ đọc.
- **Định dạng sổ:** JSON Lines (mỗi dòng một đối tượng), để công cụ đọc ổn định; chủ sở hữu xem qua báo cáo.
- **Danh sách hồi quy:** file `evaluation/known-terms.md` (mỗi từ một dòng kèm nghĩa ngắn), do chủ sở hữu duyệt trước khi thêm từ từ sổ vào; báo cáo gợi ý từ nào nên thêm.
- **Kích hoạt `term-feedback`:** khi chủ sở hữu hỏi nghĩa của một từ hoặc nói không hiểu một từ. Hỏi chung về một chủ đề ("giải thích Suspense") là việc của `tutor`, không ghi sổ.
- **Giải thích khi ghi sổ:** lời thường, tối đa khoảng 80 từ; nếu cần khẳng định thực tế thì theo quy tắc nguồn của `tutor` (xin duyệt trước khi tra web).
- **Quy tắc `frontend-architect`:** thêm `BH-004` "Explain unfamiliar terms" với eval riêng; trạng thái `draft` đến khi duyệt.
- **Phiên bản:** plugin lên 0.3.0.

**Bổ sung sau builder check (cũng là lựa chọn của người viết):**
- **Danh sách hồi quy lúc ra mắt:** `evaluation/known-terms.md` được gieo bằng các thuật ngữ trong bài Suspense kiểu cũ mà chủ sở hữu đã dán và thấy khó hiểu: `Promise`, `lazy`, `Effect`, `event handler`, `boundary`, `children`, `fallback`, mỗi từ kèm nghĩa ngắn bằng lời thường và nhãn "đề xuất, chờ chủ sở hữu xác nhận". Chủ sở hữu duyệt danh sách khi đọc tài liệu này. Case `no-unexplained-known-terms` chạy `tutor` ở kiểu người mới với bài Suspense (dùng kết quả tra cứu mô phỏng chứa các từ đó), và cũng áp dụng cho `frontend-architect` qua quy tắc `BH-004`; case truy vết tới `TU-006` và `BH-004`. Nếu danh sách trống thì case **không chạy được** và báo cáo ghi rõ "chưa chạy được", tuyệt đối không tính là đạt.
- **Từ riêng của dự án** (tên hàm/lớp nội bộ, đường dẫn, tên file, ví dụ `OrderSyncService`): `term-feedback` vẫn giải thích cho chủ sở hữu (đọc code của dự án nếu cần) nhưng **không ghi vào sổ** và nói rõ là không ghi vì có vẻ riêng của dự án. Chỉ ghi các thuật ngữ thuộc kiến thức công khai (tên công nghệ, khái niệm). Không có phiên bản "che bớt".
- **Nếu chủ sở hữu không duyệt ngoại lệ ghi sổ** hoặc nền tảng không có cú pháp phù hợp: vẫn phát hành bản dùng được, trong đó mỗi lần ghi sổ đi qua hộp thoại xin quyền thông thường của Claude Code. Ngoại lệ chỉ để giảm ma sát. Builder **không được tự sửa** `settings.json` hay cấp quyền thay chủ sở hữu; nếu cần một quy tắc cho phép hẹp thì đưa đúng nội dung quy tắc để chủ sở hữu tự thêm.
- **Từ không do agent của plugin tạo ra** (Claude thường, câu trả lời ngoài skill): ghi `agent: unknown`. Báo cáo đếm riêng mục "không rõ nguồn" và **không** đưa vào bảng xếp hạng agent. Skill không hỏi lại chủ sở hữu agent nào đã dùng từ.

## 6. Tiêu chí hoàn thành

- Hai skill đủ hợp đồng, có quy tắc và eval case; truy vết hai chiều đạt; validator và test đạt.
- Eval (chạy tay như các phase trước) tối thiểu: hỏi nghĩa một từ → có giải thích bằng lời thường **và** một dòng mới trong sổ; sổ không chứa dữ liệu riêng; hỏi chủ đề chung không ghi sổ; case hồi quy `no-unexplained-known-terms` phát hiện agent dùng từ trong danh sách mà không giải thích; `frontend-architect` giải thích từ chuyên môn lần đầu khi chưa biết trình độ.
- Báo cáo có kiểm thử tự động bằng dữ liệu mẫu: đếm đúng, không tính case chưa chạy là đạt, báo rõ khi sổ trống hoặc thiếu.
- Chủ sở hữu duyệt: các quy tắc mới và ngoại lệ ghi sổ trong `governance/policy.md`.
- README, changelog cập nhật; cài lại và dùng được ở dự án khác.

## 7. Để builder quyết định

- Cách `quality-report` tìm repo nguồn để đọc dữ liệu sống (ràng buộc mục 3), và cách skill gọi script từ bản cài đặt.
- Cú pháp quyền ghi hẹp cho đúng file sổ (cần xác minh trong tài liệu chính thức), hoặc cách khác để việc ghi sổ không phải xin duyệt từng lần.
- Schema JSONL chi tiết, tên file/thư mục, định dạng báo cáo, cách chống ghi trùng ngay lập tức.
- Chi tiết các quy tắc và eval case.

## 8. Mở (đã đóng, xem quyết định 4)

- Chủ sở hữu có đồng ý thêm **ngoại lệ hẹp** vào `governance/policy.md`: `term-feedback` được tự thêm dòng vào đúng file sổ từ lạ, không cần xin duyệt mỗi lần, mọi ghi khác vẫn theo policy hiện tại không? (Nếu không, xem mục 5: bản phát hành vẫn dùng được nhưng mỗi lần ghi sổ sẽ hiện hộp thoại xin quyền.)
