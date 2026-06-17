-- ============================================================
--  VSON - App Nhập Thông Tin  →  FULL SETUP Supabase (PostgreSQL)
--  Chạy DUY NHẤT file này là xong toàn bộ DB customer_data_db.
--  (Supabase Dashboard → SQL Editor → New query → dán → Run)
--
--  File chạy lại được nhiều lần (idempotent), gồm 3 phần:
--    PHẦN 1 - Lõi nghiệp vụ: customers / orders / order_items
--             + trigger + view order_summary + RLS
--             (customers (1) ──< orders (1) ──< order_items (n))
--    PHẦN 2 - Danh mục sản phẩm Torayvino  (bảng product_torayvino, 29 SP)
--    PHẦN 3 - Danh mục sản phẩm King Bag    (bảng product_kingbag, 58 SP)
--
--  Tổng hợp từ: schema.sql + products_torayvino.sql + products_kingbag.sql
-- ============================================================
-- ############################################################
-- #  PHẦN 1: LÕI NGHIỆP VỤ (KHÁCH / ĐƠN / SẢN PHẨM TRONG ĐƠN)  #
-- ############################################################

-- Cho phép sinh UUID (Supabase đã bật sẵn, để chắc chắn)
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1) KHÁCH HÀNG
-- ------------------------------------------------------------
create table if not exists public.customers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,                 -- customer.name  (Tên khách hàng - bắt buộc)
  customer_code text,                           -- customer.cusid (Mã khách hàng KH001)
  email         text,                           -- customer.email
  phone         text,                           -- customer.phone
  address       text,                           -- customer.address  (Địa chỉ - Pango customField10)
  district      text,                           -- customer.district (Khu vực - Pango customField11)
  ward          text,                           -- customer.ward     (Phường/Xã - Pango customField12)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Bổ sung cột địa chỉ cho DB đã tạo từ trước (chạy lại an toàn).
alter table public.customers add column if not exists address  text;
alter table public.customers add column if not exists district text;
alter table public.customers add column if not exists ward     text;

-- Mã khách hàng phải duy nhất (Postgres coi mỗi NULL là khác nhau nên vẫn
-- cho phép nhiều dòng customer_code rỗng). Dùng UNIQUE constraint (không phải
-- partial index) để upsert ON CONFLICT (customer_code) hoạt động được.
alter table public.customers drop constraint if exists customers_customer_code_key;
alter table public.customers add constraint customers_customer_code_key unique (customer_code);

-- Số điện thoại là khóa nhận diện khách -> mỗi SĐT chỉ 1 khách.
-- Dùng partial unique index (where phone is not null) để vẫn cho phép dòng NULL.
create unique index if not exists customers_phone_key
  on public.customers (phone) where phone is not null;

-- ------------------------------------------------------------
-- 2) ĐƠN HÀNG
-- ------------------------------------------------------------
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.customers (id) on delete cascade,
  order_code    text not null unique,           -- customer.orderId  (Mã đơn DH-0001 - bắt buộc, duy nhất)
  status        text,                           -- customer.orderStatus (Mới / Đã giao...)
  order_date    timestamptz default now(),      -- customer.orderDate
  total_amount  bigint not null default 0,      -- tổng tiền đơn (tự tính từ order_items)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_order_date_idx  on public.orders (order_date);

-- ------------------------------------------------------------
-- 3) SẢN PHẨM TRONG ĐƠN
-- ------------------------------------------------------------
create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  product_code  text,                           -- product.pid   (Mã SP)
  product_name  text,                           -- product.pname (Tên sản phẩm)
  price         bigint not null default 0,      -- product.price (Đơn giá, VND)
  qty           integer not null default 1 check (qty > 0),
  -- Thành tiền dòng = đơn giá * số lượng, tự tính, không cần ghi tay
  line_total    bigint generated always as (price * qty) stored,
  created_at    timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- ------------------------------------------------------------
-- 4) TRIGGER: tự cập nhật updated_at
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 5) TRIGGER: tự tính lại total_amount của đơn khi thêm/sửa/xóa SP
-- ------------------------------------------------------------
create or replace function public.recalc_order_total()
returns trigger
language plpgsql
as $$
declare
  v_order_id uuid := coalesce(new.order_id, old.order_id);
begin
  update public.orders o
     set total_amount = coalesce(
           (select sum(line_total) from public.order_items where order_id = v_order_id), 0)
   where o.id = v_order_id;
  return null;
end;
$$;

drop trigger if exists trg_order_items_recalc on public.order_items;
create trigger trg_order_items_recalc
  after insert or update or delete on public.order_items
  for each row execute function public.recalc_order_total();

-- ------------------------------------------------------------
-- 6) VIEW tiện xem nhanh đơn + khách + tổng tiền
-- ------------------------------------------------------------
create or replace view public.order_summary as
select
  o.id            as order_id,
  o.order_code,
  o.status,
  o.order_date,
  o.total_amount,
  c.name          as customer_name,
  c.customer_code,
  c.email,
  c.phone,
  (select count(*) from public.order_items i where i.order_id = o.id) as item_count
from public.orders o
join public.customers c on c.id = o.customer_id
order by o.created_at desc;

-- ------------------------------------------------------------
-- 7) ROW LEVEL SECURITY
--    Supabase mặc định chặn hết khi bật RLS. App gọi bằng anon key
--    (không đăng nhập) nên mở quyền cho cả 'anon' và 'authenticated'.
--    ⚠️ Lưu ý: anon = ai có anon key cũng đọc/ghi được. Hợp cho app
--    nội bộ/training; nếu cần bảo mật hơn thì siết lại policy sau.
-- ------------------------------------------------------------
alter table public.customers   enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "allow all for authenticated" on public.customers;
drop policy if exists "allow all" on public.customers;
create policy "allow all" on public.customers
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "allow all for authenticated" on public.orders;
drop policy if exists "allow all" on public.orders;
create policy "allow all" on public.orders
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "allow all for authenticated" on public.order_items;
drop policy if exists "allow all" on public.order_items;
create policy "allow all" on public.order_items
  for all to anon, authenticated using (true) with check (true);

-- ============================================================
--  XONG. Sau khi chạy, kiểm tra ở Table Editor sẽ thấy 3 bảng
--  customers / orders / order_items và view order_summary.
-- ============================================================


-- ############################################################
-- #  PHẦN 2: DANH MỤC SẢN PHẨM TORAYVINO                     #
-- ############################################################

-- ============================================================
--  Danh mục sản phẩm Torayvino  →  bảng public.product_torayvino
--  Chạy file này trong Supabase SQL Editor (sau schema.sql).
--  File chạy lại được nhiều lần: trùng mã hàng sẽ cập nhật (UPSERT).
--
--  Trường: id, product_code (Mã hàng), product_name (Tên sản phẩm),
--          product_group (Nhóm hàng), sku, status (Trạng thái),
--          list_price (Giá niêm yết), sale_price (Giá bán)
-- ============================================================


-- Nếu trước đó đã tạo bảng tên 'products' hoặc 'productTorayvino' thì đổi tên cho khớp.
alter table if exists public.products rename to product_torayvino;
alter table if exists public."productTorayvino" rename to product_torayvino;

-- ------------------------------------------------------------
-- Bảng danh mục sản phẩm Torayvino
-- ------------------------------------------------------------
create table if not exists public.product_torayvino (
  id            uuid primary key default gen_random_uuid(),
  product_code  text not null unique,           -- Mã hàng (vd 1.2210.004)
  product_name  text not null,                  -- Tên sản phẩm
  product_group text,                           -- Nhóm hàng (Lõi lọc nước / Vòi sen / Máy lọc nước)
  sku           text,                           -- SKU
  status        text,                           -- Trạng thái (Đang kinh doanh / Ngừng kinh doanh)
  list_price    bigint not null default 0,      -- Giá niêm yết (VND)
  sale_price    bigint not null default 0,      -- Giá bán (VND)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists product_torayvino_sku_key
  on public.product_torayvino (sku) where sku is not null;
create index if not exists product_torayvino_group_idx
  on public.product_torayvino (product_group);

-- Tự cập nhật updated_at (dùng lại hàm nếu đã có từ schema.sql)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_product_torayvino_updated_at on public.product_torayvino;
create trigger trg_product_torayvino_updated_at
  before update on public.product_torayvino
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Dữ liệu 29 sản phẩm Torayvino
-- ------------------------------------------------------------
insert into public.product_torayvino
  (product_code, product_name, product_group, sku, status, list_price, sale_price)
values
  ('1.2210.004', 'Bộ Lọc Torayvino MKC.MXJ',                                      'Lõi lọc nước', 'MKC.MXJ',          'Ngừng kinh doanh',  625000,  625000),
  ('1.2210.005', 'Bộ Lọc Torayvino MKC.TJ',                                       'Lõi lọc nước', 'MKC.TJ',           'Đang kinh doanh',   565000,  565000),
  ('1.2210.006', 'Bộ Lọc Torayvino MKC-EG',                                       'Lõi lọc nước', 'MKC-EG',           'Ngừng kinh doanh',  550000,  550000),
  ('1.2220.008-1', 'Vòi Sen Torayvino RS52 - Hồng',                               'Vòi sen',      'RS52-Hong',        'Đang kinh doanh',  1750000, 1750000),
  ('1.2200.003', 'Máy lọc Torayvino MK308T',                                      'Máy lọc nước', 'MK308T',           'Đang kinh doanh',  1480000, 1480000),
  ('1.2200.002', 'Máy lọc Torayvino MK303-EG',                                    'Máy lọc nước', 'MK303-EG',         'Ngừng kinh doanh',  990000,  990000),
  ('1.2200.001', 'Máy lọc Torayvino MK204MX',                                     'Máy lọc nước', 'MK204MX',          'Ngừng kinh doanh', 1990000, 1990000),
  ('1.2220.008-3', 'Vòi Sen Torayvino RS52 - Xanh',                               'Vòi sen',      'RS52-Xanh',        'Ngừng kinh doanh', 1750000, 1750000),
  ('1.2220.008-2', 'Vòi Sen Torayvino RS52 - Xám',                                'Vòi sen',      'RS52-Xam',         'Ngừng kinh doanh', 1750000, 1750000),
  ('1.2210.007', 'Lõi Lọc vòi sen Torayvino RSC51',                               'Lõi lọc nước', 'RSC51',            'Đang kinh doanh',   625000,  625000),
  ('1.2210.009', 'Lõi lọc Torayvino MKC.600B',                                    'Lõi lọc nước', 'MKC.600B',         'Ngừng kinh doanh',  625000,  625000),
  ('1.2210.008', 'Lõi lọc Torayvino MKC.2000B',                                   'Lõi lọc nước', 'MKC.2000B',        'Đang kinh doanh',  1290000, 1290000),
  ('1.2200.005', 'Máy lọc Torayvino MK303-600B-EG',                               'Máy lọc nước', 'MK303-600B',       'Ngừng kinh doanh', 1190000, 1190000),
  ('1.2200.004', 'Máy lọc Torayvino MK206-2000B',                                 'Máy lọc nước', 'MK206-2000B',      'Đang kinh doanh',  3099000, 3099000),
  ('1.2210.010', 'Lõi lọc Torayvino MKC.LF-EG',                                   'Lõi lọc nước', 'MKC.LF-EG',        'Đang kinh doanh',  1290000, 1290000),
  ('1.2210.011', 'Combo 2 bộ Lọc Torayvino MKC.TJ',                               'Lõi lọc nước', '2MKC.TJ',          'Đang kinh doanh',  1130000, 1130000),
  ('1.2210.012', 'Combo 2 bộ Lọc Torayvino MKC.MXJ',                              'Lõi lọc nước', '2MKC.MXJ',         'Đang kinh doanh',  1250000, 1250000),
  ('1.2210.013', 'Combo 2 bộ Lọc Torayvino RSC51',                                'Lõi lọc nước', '2RSC51',           'Đang kinh doanh',  1250000, 1250000),
  ('1.2210.014', 'Combo 2 bộ Lọc Torayvino MKC.600B',                             'Lõi lọc nước', '2MKC.600B',        'Đang kinh doanh',  1250000, 1250000),
  ('1.2210.015', 'Combo 2 bộ Lọc Torayvino MKC.2000B',                            'Lõi lọc nước', '2MKC.2000B',       'Đang kinh doanh',  2580000, 2580000),
  ('1.2210.016', 'Combo 2 bộ Lọc Torayvino MKC.LF-EG',                            'Lõi lọc nước', '2MKC.LF-EG',       'Đang kinh doanh',  2580000, 2580000),
  ('1.2230.001', 'Bình lọc nước Pitcher PT304SV',                                 'Máy lọc nước', 'PT304SV',          'Đang kinh doanh',  1590000, 1590000),
  ('1.2210.017', 'Lõi lọc bình nước Pitcher PTC.SVJ',                             'Lõi lọc nước', 'PTC.SVJ',          'Đang kinh doanh',   625000,  625000),
  ('1.2220.001', 'Vòi sen tắm khử Clo RS54',                                      'Vòi sen',      'RS54',             'Đang kinh doanh',  1990000, 1990000),
  ('1.2200.003-1', '[GIFT] Thiết bị lọc nước tại vòi Torayvino (PN# MK308T)',     'Máy lọc nước', 'MK308T-GFT',       'Đang kinh doanh',  1480000, 1480000),
  ('1.2220.008-4', '[GIFT] Vòi sen tắm khử chlorine Torayvino (PN# RS52) - Hồng', 'Vòi sen',      'RS52-Hong-GFT',    'Đang kinh doanh',  1750000, 1750000),
  ('1.2200.004-1', '[GIFT] Thiết bị lọc nước Torayvino MK206-2000B-EG (PN# MK206-2000B-EG)', 'Máy lọc nước', 'MK206-2000B-GFT', 'Đang kinh doanh', 3099000, 3099000),
  ('1.2230.001-1', '[GIFT] Bình lọc nước Torayvino Pitcher PT304SV',              'Máy lọc nước', 'PT304SV-GFT',      'Đang kinh doanh',  1590000, 1590000),
  ('1.2220.001-1', '[GIFT] Vòi sen tắm khử Clo RS54',                             'Vòi sen',      'RS54-GFT',         'Đang kinh doanh',  1990000, 1990000)
on conflict (product_code) do update set
  product_name  = excluded.product_name,
  product_group = excluded.product_group,
  sku           = excluded.sku,
  status        = excluded.status,
  list_price    = excluded.list_price,
  sale_price    = excluded.sale_price;

-- ------------------------------------------------------------
-- RLS (mở cho anon + authenticated, đồng bộ với các bảng khác)
-- ------------------------------------------------------------
alter table public.product_torayvino enable row level security;
drop policy if exists "allow all" on public.product_torayvino;
create policy "allow all" on public.product_torayvino
  for all to anon, authenticated using (true) with check (true);

-- ============================================================
--  XONG. Kiểm tra: select * from public.product_torayvino order by product_code;
-- ============================================================


-- ############################################################
-- #  PHẦN 3: DANH MỤC SẢN PHẨM KING BAG                      #
-- ############################################################

-- ============================================================
--  Danh mục sản phẩm King Bag  →  bảng public.product_kingbag
--  Cấu trúc giống bảng product_torayvino.
--  Chạy file này trong Supabase SQL Editor (sau schema.sql).
--  File chạy lại được nhiều lần: trùng mã hàng sẽ cập nhật (UPSERT).
--
--  Trường: id, product_code (Mã hàng), product_name (Tên sản phẩm),
--          product_group (Nhóm hàng), sku, status (Trạng thái),
--          list_price (Giá niêm yết), sale_price (Giá bán)
-- ============================================================


-- Nếu trước đó đã tạo bảng tên 'productKingbag' thì đổi tên cho khớp.
alter table if exists public."productKingbag" rename to product_kingbag;

-- ------------------------------------------------------------
-- Bảng danh mục sản phẩm King Bag
-- ------------------------------------------------------------
create table if not exists public.product_kingbag (
  id            uuid primary key default gen_random_uuid(),
  product_code  text not null unique,           -- Mã hàng (vd H.8800.001)
  product_name  text not null,                  -- Tên sản phẩm
  product_group text,                           -- Nhóm hàng (Balo / Túi đeo chéo / Túi laptop ...)
  sku           text,                           -- SKU
  status        text,                           -- Trạng thái (Đang kinh doanh / Ngừng kinh doanh)
  list_price    bigint not null default 0,      -- Giá niêm yết (VND)
  sale_price    bigint not null default 0,      -- Giá bán (VND)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists product_kingbag_sku_key
  on public.product_kingbag (sku) where sku is not null;
create index if not exists product_kingbag_group_idx
  on public.product_kingbag (product_group);

-- Tự cập nhật updated_at (dùng lại hàm nếu đã có từ schema.sql)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_product_kingbag_updated_at on public.product_kingbag;
create trigger trg_product_kingbag_updated_at
  before update on public.product_kingbag
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Dữ liệu 58 sản phẩm King Bag
-- ------------------------------------------------------------
insert into public.product_kingbag
  (product_code, product_name, product_group, sku, status, list_price, sale_price)
values
  ('H.8800.001', 'Balo KINGBAG VICTOR',   'Balo', 'VICTOR',  'Ngừng kinh doanh', 728000,  510000),
  ('H.8800.002', 'Balo KINGBAG MARCUS',   'Balo', 'MARCUS',  'Ngừng kinh doanh', 957000,  670000),
  ('H.8800.003', 'Balo KINGBAG ERIC',     'Balo', 'ERIC',    'Đang kinh doanh',  700000,  490000),
  ('H.8800.004', 'Balo KINGBAG KRATOS',   'Balo', 'KRATOS',  'Đang kinh doanh',  980000,  490000),
  ('H.8800.005', 'Balo KINGBAG HORIZON',  'Balo', 'HORIZON', 'Đang kinh doanh',  995000,  696000),
  ('H.8800.006', 'Balo KINGBAG APOLLO',   'Balo', 'APOLLO',  'Đang kinh doanh',  1128000, 790000),
  ('H.8800.007', 'Balo KINGBAG ZELOS',    'Balo', 'ZELOS',   'Ngừng kinh doanh', 1186000, 795000),
  ('H.8800.008', 'Balo KINGBAG HORMES',   'Balo', 'HORMES',  'Đang kinh doanh',  828000,  579000),
  ('H.8800.009', 'Balo KINGBAG READY',    'Balo', 'READY',   'Ngừng kinh doanh', 938000,  650000),
  ('H.8800.010', 'Balo KINGBAG PASSION',  'Balo', 'PASSION', 'Đang kinh doanh',  1040000, 728000),
  ('H.8810.001', 'Túi du lịch KINGBAG SKY',          'Túi du lịch',   'SKY',       'Đang kinh doanh',  780000, 390000),
  ('H.8820.001', 'Túi đeo chéo KINGBAG TORINO',      'Túi đeo chéo',  'TORINO',    'Ngừng kinh doanh', 428000, 298000),
  ('H.8820.002', 'Túi đeo chéo KINGBAG ORI',         'Túi đeo chéo',  'ORI',       'Đang kinh doanh',  672000, 470000),
  ('H.8820.003', 'Túi đeo chéo KINGBAG BAMBOO',      'Túi đeo chéo',  'BAMBOO',    'Đang kinh doanh',  580000, 290000),
  ('H.8820.004', 'Túi đeo chéo KINGBAG JULIUS I',    'Túi đeo chéo',  'JULIUS I',  'Đang kinh doanh',  780000, 390000),
  ('H.8820.005', 'Túi đeo chéo KINGBAG JULIUS IV',   'Túi đeo chéo',  'JULIUS IV', 'Ngừng kinh doanh', 780000, 390000),
  ('H.8800.011', 'Balo KINGBAG TURIN',   'Balo', 'TURIN', 'Ngừng kinh doanh', 1228000, 1228000),
  ('H.8800.012', 'Balo KINGBAG LECCE',   'Balo', 'LECCE', 'Đang kinh doanh',  1425000, 1425000),
  ('H.8800.013', 'Balo KINGBAG LUCCA',   'Balo', 'LUCCA', 'Ngừng kinh doanh', 1490000, 1490000),
  ('H.8800.014',   'Balo KINGBAG COLUMBUS',           'Balo đa năng', 'COLUMBUS-Den',  'Đang kinh doanh', 690000, 690000),
  ('H.8800.015-1', 'Balo KINGBAG POLEMOS - Đen',      'Balo',         'POLEMOS - Den', 'Đang kinh doanh', 545000, 495000),
  ('H.8800.015-2', 'Balo KINGBAG POLEMOS - Xám',      'Balo',         'POLEMOS - Xam', 'Đang kinh doanh', 545000, 495000),
  ('H.8800.015-3', 'Balo KINGBAG POLEMOS - Xanh',     'Balo',         'POLEMOS - Xanh','Đang kinh doanh', 545000, 495000),
  ('H.8800.016-1', 'Balo KINGBAG PONOS - Đen',        'Balo',         'PONOS-Den',     'Đang kinh doanh', 545000, 495000),
  ('H.8800.016-2', 'Balo KINGBAG PONOS - Xám',        'Balo',         'PONOS-Xam',     'Đang kinh doanh', 545000, 495000),
  ('H.8800.016-3', 'Balo KINGBAG PONOS - Xanh',       'Balo',         'PONOS-Xanh',    'Đang kinh doanh', 545000, 495000),
  ('H.8800.017-1', 'Balo KINGBAG POROS - Đen',        'Balo',         'POROS-Den',     'Đang kinh doanh', 545000, 495000),
  ('H.8800.017-2', 'Balo KINGBAG POROS - Xám',        'Balo',         'POROS-Xam',     'Đang kinh doanh', 545000, 495000),
  ('H.8800.017-3', 'Balo KINGBAG POROS - Xanh',       'Balo',         'POROS-Xanh',    'Đang kinh doanh', 545000, 495000),
  ('H.8800.018', 'Balo KINGBAG LEGEND',    'Balo', 'LEGEND',    'Ngừng kinh doanh', 1890000, 1890000),
  ('H.8800.019', 'Balo KINGBAG SOFIA I',   'Balo', 'SOFIA I',   'Đang kinh doanh',  655000,  595000),
  ('H.8800.020', 'Balo KINGBAG SOFIA II',  'Balo', 'SOFIA II',  'Đang kinh doanh',  655000,  595000),
  ('H.8800.021', 'Balo KINGBAG SOFIA III', 'Balo', 'SOFIA III', 'Đang kinh doanh',  655000,  595000),
  ('H.8800.022', 'Balo KINGBAG SOFIA IV',  'Balo', 'SOFIA IV',  'Đang kinh doanh',  655000,  595000),
  ('H.8810.002', 'Túi Du Lịch KINGBAG ALPHA',         'Túi du lịch',  'ALPHA',        'Đang kinh doanh', 890000, 890000),
  ('H.8800.022-1', 'Balo trekking KINGBAG Pontus - Trắng', 'Balo',    'Pontus-Trang', 'Đang kinh doanh', 650000, 620000),
  ('H.8800.022-2', 'Balo trekking KINGBAG Pontus - Be',    'Balo',    'Pontus-Be',    'Đang kinh doanh', 650000, 620000),
  ('H.8830.001', 'Túi tiện ích KINGBAG Tornado',      'Túi phụ kiện', 'Tornado',      'Đang kinh doanh', 160000, 160000),
  ('H.8800.023-1', 'Balo trekking KINGBAG Notus - Trắng',  'Balo',    'Notus-Trang',  'Đang kinh doanh', 690000, 650000),
  ('H.8800.023-2', 'Balo trekking KINGBAG Notus - Be',     'Balo',    'Notus-Be',     'Đang kinh doanh', 690000, 650000),
  ('H.8800.024', 'Ba lô Laptop Kingbag OSCAR',        'Balo',         'OSCAR',        'Đang kinh doanh', 490000, 490000),
  ('H.8840.002-1', 'Túi chống sốc laptop Kingbag Luna 14 inch - Xám',       'Túi laptop', 'Luna14-Xam',  'Đang kinh doanh', 725000, 390000),
  ('H.8840.002-2', 'Túi chống sốc laptop Kingbag Luna 14 inch - Xanh Navy', 'Túi laptop', 'Luna14-Xanh', 'Đang kinh doanh', 725000, 390000),
  ('H.8840.002-3', 'Túi chống sốc laptop Kingbag Luna 14 inch - Đen',       'Túi laptop', 'Luna14-Den',  'Đang kinh doanh', 725000, 390000),
  ('H.8840.002-4', 'Túi chống sốc laptop Kingbag Luna 15 inch - Xám',       'Túi laptop', 'Luna15-Xam',  'Đang kinh doanh', 745000, 390000),
  ('H.8840.002-5', 'Túi chống sốc laptop Kingbag Luna 15 inch - Xanh Navy', 'Túi laptop', 'Luna15-Xanh', 'Đang kinh doanh', 745000, 390000),
  ('H.8840.002-6', 'Túi chống sốc laptop Kingbag Luna 15 inch - Đen',       'Túi laptop', 'Luna15-Den',  'Đang kinh doanh', 745000, 390000),
  ('H.8840.003-1', 'Túi chống sốc laptop Kingbag Fiona 14 inch - Xám',       'Túi laptop', 'Fiona14-Xam',  'Đang kinh doanh', 695000, 390000),
  ('H.8840.003-2', 'Túi chống sốc laptop Kingbag Fiona 14 inch - Xanh Navy', 'Túi laptop', 'Fiona14-Xanh', 'Đang kinh doanh', 695000, 390000),
  ('H.8840.003-3', 'Túi chống sốc laptop Kingbag Fiona 14 inch - Đen',       'Túi laptop', 'Fiona14-Den',  'Đang kinh doanh', 695000, 390000),
  ('H.8840.003-4', 'Túi chống sốc laptop Kingbag Fiona 15 inch - Xám',       'Túi laptop', 'Fiona15-Xam',  'Đang kinh doanh', 715000, 390000),
  ('H.8840.003-5', 'Túi chống sốc laptop Kingbag Fiona 15 inch - Xanh Navy', 'Túi laptop', 'Fiona15-Xanh', 'Đang kinh doanh', 715000, 390000),
  ('H.8840.003-6', 'Túi chống sốc laptop Kingbag Fiona 15 inch - Đen',       'Túi laptop', 'Fiona15-Den',  'Đang kinh doanh', 715000, 390000),
  ('H.8800.014-2', 'Balo KINGBAG COLUMBUS - Xám',       'Balo đa năng', 'COLUMBUS-Xam',  'Đang kinh doanh', 690000, 690000),
  ('H.8800.014-3', 'Balo KINGBAG COLUMBUS - Xanh Navy', 'Balo đa năng', 'COLUMBUS-Xanh', 'Đang kinh doanh', 690000, 690000),
  ('H.8800.025', 'Balô Laptop King bag Henry',  'Balo', 'Henry',  'Đang kinh doanh', 490000, 490000),
  ('H.8800.026', 'Balô Laptop King bag Antony', 'Balo', 'Antony', 'Đang kinh doanh', 490000, 490000),
  ('H.8800.027', 'Balô Laptop King bag Robin',  'Balo', 'Robin',  'Đang kinh doanh', 490000, 490000)
on conflict (product_code) do update set
  product_name  = excluded.product_name,
  product_group = excluded.product_group,
  sku           = excluded.sku,
  status        = excluded.status,
  list_price    = excluded.list_price,
  sale_price    = excluded.sale_price;

-- ------------------------------------------------------------
-- RLS (mở cho anon + authenticated, đồng bộ với các bảng khác)
-- ------------------------------------------------------------
alter table public.product_kingbag enable row level security;
drop policy if exists "allow all" on public.product_kingbag;
create policy "allow all" on public.product_kingbag
  for all to anon, authenticated using (true) with check (true);

-- ============================================================
--  XONG. Kiểm tra: select * from public.product_kingbag order by product_code;
-- ============================================================
