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

create extension if not exists "pgcrypto";

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
