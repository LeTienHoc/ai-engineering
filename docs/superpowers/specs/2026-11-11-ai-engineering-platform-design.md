# AI Engineering Platform – Design (Phase 1: Core + Agent mẫu)

Ngày: 2026-11-11 · Trạng thái: DRAFT chờ duyệt

## 1. Ý định và lý do (why)

Chủ sở hữu là một lập trình viên frontend (React/Next.js), dùng Claude Code hằng ngày. Nỗi đau hiện tại khi làm việc với AI:

- AI tự quyết định thiếu chính xác, hay **đoán mò** thay vì hỏi.
- Code **không nhất quán**: mỗi lần một kiểu, không theo luật cố định.
- Giao diện làm chưa chuẩn; code chưa tối ưu, chưa chú ý bảo mật.

Tầm nhìn dài hạn (lời chủ sở hữu): *"Một nền tảng tập trung để học tập, thiết kế, xây dựng, quản lý và vận hành AI Agents"*, dựng trên 5 nền tảng cốt lõi: Instruction, Context, Workflow, Evaluation, Governance & Security (xem ghi chú gốc "AI Plugin Engineering – Knowledge Notes").

Mục đích thực sự: AI làm việc như một đồng nghiệp đã thuộc luật, kiểm chứng được, không phải một AI mới mỗi lần. Từ nền tảng này chủ sở hữu sẽ tạo ra nhiều agent khác (ví dụ agent giảng dạy, agent build FE).

## 2. Phạm vi

Đây là tầm nhìn gồm nhiều dự án độc lập. **Tài liệu này chỉ thiết kế Phase 1.** Các phase sau sẽ brainstorm riêng.

| Phase | Nội dung | Trạng thái |
|---|---|---|
| **1** | **Lõi chung + một agent mẫu (Frontend Architect)** | **Tài liệu này** |
| 2 | Agent Giảng dạy (dạy khái niệm dễ hiểu, dùng lại lõi) | Sau |
| 3 | Quản lý và vận hành (dashboard, theo dõi chất lượng, phiên bản) | Sau, chỉ khi đã có ≥2 agent chạy thật |

## 3. Mục tiêu / Phi mục tiêu / Phản mục tiêu

**Mục tiêu**
- G1. Một khung chuẩn mà mọi agent mới viết theo cùng cách (mẫu skill, mẫu eval, quy tắc governance), kiểm tra được tự động.
- G2. Agent Frontend Architect mẫu chứng minh khung hoạt động: cho kết quả nhất quán, hỏi khi thiếu thông tin thay vì đoán.
- G3. Bộ evaluation chạy lại được; sửa quy tắc nào cũng phải qua eval.
- G4. Governance ở mức bảo vệ chính chủ sở hữu: không lộ secret, hỏi trước hành động nhạy cảm/khó hoàn tác, có phiên bản và changelog.
- G5. Thêm agent mới chủ yếu là ghép các phần có sẵn, không làm hệ thống rối hơn.

**Phi mục tiêu (Phase 1)**
- Không làm giao diện web/dashboard.
- Không phân phối cho người khác: không marketplace, không hướng dẫn cài đặt cho đội, không quản lý quyền nhiều người dùng.
- Không MCP server, command, hook trừ khi có nhu cầu cụ thể xuất hiện khi làm (theo ghi chú gốc: "chỉ thêm khi có nhu cầu").
- Không gắn với bất kỳ dự án/công ty cụ thể nào. Chủ sở hữu đã yêu cầu **bỏ hoàn toàn O2O Operation Portal**: không dùng skill, quy ước hay code từ đó.
- Không agent giảng dạy ở phase này.

**Phản mục tiêu (thất bại dù "chạy được")**
- Prompt dài nhưng không kiểm chứng được.
- Quy tắc do AI tự bịa, không có nguồn.
- Agent vẫn đoán mò khi thiếu thông tin.
- Cùng một đầu vào cho kết quả khác hẳn nhau.
- Khung quá nặng so với một người dùng (over-engineering).

## 4. Ràng buộc

- Người dùng duy nhất: chủ sở hữu. Nền tảng chạy trong Claude Code, hệ điều hành Windows 11, thư mục làm việc `D:\DuAn\ai-enginner` (hiện **không phải git repo**).
- Tài liệu và giải thích cho chủ sở hữu bằng tiếng Việt, dễ hiểu; định danh kỹ thuật (tên file, key) dùng tiếng Anh.
- Mỗi quy tắc frontend phải có **nguồn** (tài liệu chính thức hoặc thực hành được kiểm chứng) và ít nhất một eval case.
- Kiểm tra tài liệu chính thức hiện hành của Claude Code plugin/skill trước khi chốt định dạng, vì định dạng có thể đã đổi.
- Không có secret trong context, prompt, log.

## 5. Các quyết định đã chốt (do chủ sở hữu)

1. Nền tảng **chỉ cho riêng chủ sở hữu dùng**.
2. Mục tiêu là AI engineer hiệu quả, theo thực hành mở rộng được kiểu công ty lớn (Google/Meta).
3. Bộ quy tắc frontend **chưa có**; AI engineer giúp dựng nó.
4. Phase 1 chỉ gồm lõi + một agent mẫu.

## 6. Hướng thiết kế (lựa chọn của người viết, **chưa được chủ sở hữu xác nhận riêng**, chủ sở hữu đã nói "oke" với hướng tổng thể)

**Hình thức:** một Claude Code plugin dạng file, không UI. Các thành phần dự kiến, tạo dần khi cần:

```
ai-engineering/
├── core/         # nguồn sự thật: nguyên tắc, mẫu skill, mẫu eval, schema/hợp đồng
├── skills/       # agent/skill cụ thể (Phase 1: frontend-architect)
├── evaluation/   # test case + cách chấm + kết quả ghi nhận
├── governance/   # quyền hạn, secret, approval, versioning, changelog
├── tests/        # kiểm tra cấu trúc tự động (validate hợp đồng)
└── README.md
```

**Nguyên tắc kiểu doanh nghiệp lớn, áp dụng cho nền tảng:**
- Một nguồn sự thật: mỗi quy tắc viết đúng một chỗ trong `core/`, agent tham chiếu thay vì chép.
- Hợp đồng rõ: mỗi skill khai báo vai trò, đầu vào, đầu ra, giới hạn, điều kiện hỏi lại; có validator kiểm tự động.
- Thay đổi phải qua eval: sửa quy tắc → chạy lại eval → đạt mới nhận.
- Module nhỏ, ghép được.
- Phiên bản + changelog + khả năng rollback (xem mục Mở).
- Quy tắc có nguồn gốc ghi kèm.

**Agent mẫu Frontend Architect (React/Next.js):**
- Workflow: Understand → Analyze → Plan → Implement → Verify → Report (theo ghi chú gốc), với điểm **dừng và hỏi** khi thiếu thông tin, và điểm cần chủ sở hữu duyệt trước hành động rủi ro.
- Bộ quy tắc mặc định (kiến trúc thư mục, đặt tên, state/data fetching, accessibility, hiệu năng, bảo mật cơ bản) do builder đề xuất dựa trên tài liệu chính thức React/Next.js, **chủ sở hữu duyệt** trước khi thành chuẩn.

## 7. Tiêu chí hoàn thành Phase 1

- Có khung `core` + validator chạy được, kiểm tra skill đúng hợp đồng.
- Skill Frontend Architect có tên, mô tả, hướng dẫn, ví dụ sử dụng, workflow có bước verify.
- Bộ eval gồm tình huống thành công, lỗi và biên, trong đó có case "thiếu thông tin → phải hỏi, không đoán", và case bảo mật (không lộ secret, xử lý nội dung ngoài như dữ liệu không đáng tin). Kết quả chạy được ghi lại.
- Quy tắc quyền hạn/approval/secret viết rõ trong `governance/`.
- README (cách dùng, giới hạn đã biết) và changelog.
- Chủ sở hữu chạy lại được theo README và thấy kết quả nhất quán trên cùng một đầu vào.

## 8. Để builder quyết định

- Cấu trúc file chi tiết, định dạng schema/validator, ngôn ngữ viết công cụ kiểm tra (gợi ý: TypeScript/Node, theo ghi chú gốc).
- Cách chấm eval (rubric, tự động hay chấm bằng model) và cách đo "nhất quán".
- Chi tiết bộ quy tắc frontend mặc định (trình chủ sở hữu duyệt).
- Cách dùng hook hoặc command nếu thật sự cần.

## 9. Quyết định bổ sung sau builder check

**Do chủ sở hữu trả lời:**
- Eval chạy **qua Claude Code** (không dùng Anthropic API, không cần API key); chủ sở hữu tự chạy bằng tay. Việc chấm điểm do session Claude Code thực hiện theo rubric. Validator cấu trúc vẫn là công cụ tĩnh, không gọi model.
- Plugin phải **cài một lần và dùng được ở mọi dự án khác**, không chỉ trong thư mục này. Nghĩa là đóng gói dạng Claude Code plugin cài ở mức người dùng; "chạy theo README" gồm bước cài và thử ở một dự án khác. Không được phụ thuộc đường dẫn `D:\DuAn\ai-enginner`.

**Lựa chọn của người viết (chủ sở hữu xem lại khi đọc):**
- Công cụ: máy đã có Node v26 / npm 11, dùng TypeScript/Node cho validator.
- Bộ quy tắc frontend: dựng bản tối thiểu trước (React/Next.js App Router + TypeScript), chủ sở hữu duyệt như một cổng; chưa duyệt thì chưa là chuẩn. Bản mở rộng để phase sau.
- "Nhất quán": chạy lặp cùng đầu vào, cấu trúc và quyết định phải giống nhau, câu chữ được khác; ngưỡng cụ thể ghi trong bộ eval. Bắt buộc hỏi lại khi thiếu thông tin mà đoán sai sẽ đổi kết quả.
- `git init` thư mục này để có phiên bản và rollback; eval chạy tay, chưa gắn hook/CI.
- Thư mục `.claude` chưa tồn tại; thư mục hiện chỉ có `docs/`.
