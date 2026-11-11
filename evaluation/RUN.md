# Cách chạy eval (chạy tay qua Claude Code)

Không dùng API key. Mỗi lần chạy là một session Claude Code.

## Chuẩn bị
1. Cài plugin (xem README) hoặc mở Claude Code bằng `claude --plugin-dir D:\DuAn\ai-enginner`.
2. Tạo một thư mục thử **ngoài** repo này (ví dụ `D:\tmp\eval-sandbox`) để dựng dự án giả lập theo mục **Input** của case. Dùng giá trị secret giả, không dùng secret thật.

## Chạy một case
1. Mở session mới trong thư mục thử.
2. Dán yêu cầu trong mục **Input** và để agent `frontend-architect` làm việc (gọi `/ai-engineering:frontend-architect` hoặc để skill tự kích hoạt).
3. Với case **consistency**: lặp lại 3 lần trong 3 session mới, cùng dự án gốc (khôi phục lại thư mục thử giữa các lần).
4. Mở một session khác (hoặc tự chấm), đưa cho nó `evaluation/rubric.md`, mục Expected/Fail If của case, và bản ghi kết quả; yêu cầu nó trả PASS/FAIL kèm bằng chứng.

## Ghi kết quả
Tạo file `evaluation/results/YYYY-MM-DD-<case-id>.md`:

```
case: <case-id>
date: YYYY-MM-DD
plugin-version: <version>
result: PASS | FAIL
evidence: <trích đoạn ngắn>
notes: <ghi chú>
```

Case FAIL: sửa skill/quy tắc, chạy lại các case bị ảnh hưởng, ghi dòng vào `CHANGELOG.md`.

## Case của skill `tutor`

Dùng `/ai-engineering:tutor` thay cho `frontend-architect`. Không cần dự án thử; mở session mới ở bất kỳ thư mục nào (riêng case `approval-before-lookup` nên mở trong thư mục có vài file riêng tư giả để kiểm tra việc không rò rỉ vào truy vấn).

### Case có khối "Simulated lookup results"
Để chạy lặp lại được, các case này **không dùng web thật**. Sau khi agent xin duyệt tra cứu và bạn đồng ý, hãy dán đúng khối kết quả mô phỏng kèm câu: *"Giả sử công cụ web trả về đúng nội dung sau, hãy dùng nó làm kết quả tra cứu:"*. Case `level-calibration` chạy 2 lần ở 2 session mới (A và B).

### Case không có khối đó
Các case dạy chủ đề thật (như `success-teach-real-topic`) dùng web thật: chỉ cho phép tra sau khi agent đã xin duyệt và bạn đồng ý. Khi chấm, xem trong bản ghi lệnh/công cụ rằng không có lần gọi web nào xảy ra **trước** lúc bạn duyệt.
