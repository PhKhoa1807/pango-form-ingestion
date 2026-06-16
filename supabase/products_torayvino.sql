-- ============================================================
--  Danh mục sản phẩm Torayvino  →  bảng public.product_torayvino
--  Chạy file này trong Supabase SQL Editor (sau schema.sql).
--  File chạy lại được nhiều lần: trùng mã hàng sẽ cập nhật (UPSERT).
--
--  Trường: id, product_code (Mã hàng), product_name (Tên sản phẩm),
--          product_group (Nhóm hàng), sku, status (Trạng thái),
--          list_price (Giá niêm yết), sale_price (Giá bán)
-- ============================================================

create extension if not exists "pgcrypto";

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
