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
