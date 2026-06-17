-- ============================================================
--  Migration: thêm địa chỉ vào bảng customers
--  Chạy trên DB ĐÃ CÓ dữ liệu (Supabase Dashboard → SQL Editor → Run).
--  An toàn chạy lại nhiều lần (if not exists).
--
--  Map sang Pango:
--    address  -> customField10  (Địa chỉ: số nhà, đường...)
--    district -> customField11  (Quận/Huyện)
--    ward     -> customField12  (Phường/Xã)
--    province -> customField13  (Tỉnh/Thành phố)
-- ============================================================

alter table public.customers add column if not exists address  text;
alter table public.customers add column if not exists province text;
alter table public.customers add column if not exists district text;
alter table public.customers add column if not exists ward     text;
