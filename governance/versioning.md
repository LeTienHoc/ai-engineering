# Phiên bản và quy trình thay đổi

- **Semver** cho plugin: sửa lỗi nhỏ → patch; thêm skill/quy tắc → minor; đổi hợp đồng gây vỡ → major. Cập nhật `version` trong `.claude-plugin/plugin.json`.
- **Changelog:** mỗi thay đổi có một dòng trong `CHANGELOG.md`.
- **Đổi quy tắc:** chạy lại các eval case được quy tắc đó tham chiếu, lưu kết quả vào `evaluation/results/`, rồi mới commit. Quy tắc mới chỉ thành `Status: approved` khi chủ sở hữu duyệt.
- **Trước khi commit:** `node --test tests/` và `node tools/validate.ts` phải sạch.
- **Rollback:** `git revert <commit>` hoặc quay về tag phiên bản trước (`git tag vX.Y.Z` mỗi lần phát hành).
