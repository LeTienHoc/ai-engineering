# Changelog

## Unreleased
- Khung plugin, validator (skill, eval, truy vết quy tắc, quét secret), core, governance.
- Skill `frontend-architect` với quy tắc FE-001..FE-009 và BH-001..BH-003 (trạng thái draft, chờ duyệt), 8 eval case, rubric, hướng dẫn chạy, README.
- Sau review độc lập: truy vết hai chiều rule ↔ case (UNKNOWN_RULE, TRACE_MISMATCH, ORPHAN_CASE, FILENAME_ID); phát hiện heading quy tắc không đọc được; kiểm tra Status/Source; chịu được BOM; từ chối YAML dạng block/đa dòng; quét secret mọi file (kể cả `.env*`) với mẫu chính xác hơn; làm rõ rubric, quy tắc hỏi-hay-giả-định và chính sách `.env`; thêm FE-008 (đặt tên), FE-009 (kiểm tra input/phân quyền).
