# Danh sách thuật ngữ hồi quy

Các từ chuyên môn mà chủ sở hữu đã thấy khó hiểu khi agent dùng mà không giải thích. Case `no-unexplained-known-terms` kiểm tra rằng agent không dùng các từ này mà không giải thích bằng lời thường ngay chỗ xuất hiện lần đầu.

Mỗi dòng: `- từ | nghĩa ngắn bằng lời thường | proposed hoặc confirmed`. Từ ở trạng thái `proposed` là đề xuất, chờ chủ sở hữu xác nhận; chỉ chủ sở hữu được đổi sang `confirmed`. Báo cáo chất lượng gợi ý từ nào trong sổ chưa có ở đây.

- Promise | Lời hứa rằng một kết quả sẽ có sau, giống như phiếu hẹn lấy đồ | proposed
- lazy | Chỉ chuẩn bị một phần khi thật sự cần dùng đến nó, chưa cần ngay từ đầu | proposed
- Effect | Một việc phải làm thêm sau khi màn hình đã hiện ra, như gửi tin nhắn hoặc lấy dữ liệu từ bên ngoài | proposed
- event handler | Đoạn việc được giao cho trang web làm mỗi khi người dùng làm một thao tác, như bấm nút | proposed
- boundary | Một đường ranh giới bao quanh một nhóm phần để xử lý chung cho cả nhóm | proposed
- children | Những phần nằm bên trong một phần khác, như các món nằm trong một khay | proposed
- fallback | Thứ hiện tạm thay thế trong lúc phần thật chưa sẵn sàng | proposed
