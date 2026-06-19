import { useEffect, useRef, useState } from 'react'
import { money } from '../lib/pango.js'

const sizes = {
  md: 'px-[11px] py-[9px] text-[14px]',
  sm: 'px-[9px] py-[6px] text-[13px]',
}

// Ô gõ-để-tìm sản phẩm: gọi search(query) server-side, chọn 1 kết quả -> onPick(product).
//  value   : text hiển thị (đồng bộ từ row, vd row.pid hoặc row.pname)
//  onChange: cập nhật text khi gõ tay (cho phép nhập SP không có trong danh mục)
//  search  : hàm async (query) => [{ code, name, price, group, source }]
//  onPick  : (product) => autofill mã/tên/đơn giá
export function ProductPicker({ value, onChange, search, onPick, placeholder, size = 'md', disabled }) {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const boxRef = useRef(null)
  const timer = useRef(null)
  const reqId = useRef(0)

  // Đồng bộ khi value đổi từ ngoài (chọn ở ô kia / reset form) — KHÔNG search lại.
  useEffect(() => {
    setQuery((q) => (value !== q ? value || '' : q))
  }, [value])

  // Click ra ngoài -> đóng danh sách.
  // Nghe 'pointerdown' ở CAPTURE phase: listener chạy trước mọi xử lý của React Aria
  // (Dropdown Danh mục preventDefault/stopPropagation pointerdown ở bubble) nên luôn bắt được.
  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDoc, true)
    return () => document.removeEventListener('pointerdown', onDoc, true)
  }, [])

  // Search có debounce + reqId chống race (kết quả cũ về trễ không ghi đè).
  // Query rỗng (vừa click vào ô) -> chạy ngay (delay 0) để sổ danh sách liền.
  const runSearch = (text) => {
    clearTimeout(timer.current)
    const q = text.trim()
    setLoading(true)
    timer.current = setTimeout(
      async () => {
        const id = ++reqId.current
        try {
          const list = await search(q)
          if (id === reqId.current) {
            setResults(list)
            setOpen(true)
          }
        } catch {
          if (id === reqId.current) setResults([])
        } finally {
          if (id === reqId.current) setLoading(false)
        }
      },
      q ? 250 : 0,
    )
  }

  const onInput = (e) => {
    const v = e.target.value
    setQuery(v)
    onChange?.(v)
    setOpen(true)
    runSearch(v)
  }

  // Click/focus vào ô -> mở danh sách ngay (search cả khi chưa gõ).
  const onFocus = () => {
    setOpen(true)
    runSearch(query)
  }

  const pick = (item) => {
    clearTimeout(timer.current)
    setResults([])
    setOpen(false)
    onPick(item)
  }

  const cls =
    'w-full rounded-lg border border-line bg-card2 text-txt outline-none ' +
    'focus:border-accent placeholder:text-muted/70 disabled:cursor-not-allowed ' +
    `disabled:opacity-60 ${sizes[size]}`

  return (
    <div ref={boxRef} className="relative">
      <input
        type="text"
        value={query}
        disabled={disabled}
        placeholder={placeholder}
        className={cls}
        onChange={onInput}
        onFocus={onFocus}
      />
      {open && !disabled && (
        <ul
          className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-line bg-card shadow-md"
          onMouseDown={(e) => e.preventDefault()}
        >
          {loading ? (
            <li className="px-[11px] py-[7px] text-[13px] text-muted">Đang tìm…</li>
          ) : results.length === 0 ? (
            <li className="px-[11px] py-[7px] text-[13px] text-muted">Không tìm thấy</li>
          ) : (
            results.map((it) => (
              <li
                key={`${it.source}-${it.code}`}
                onClick={() => pick(it)}
                className="cursor-pointer px-[11px] py-[7px] text-[13px] hover:bg-card2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold text-txt">{it.name}</span>
                  <span className="shrink-0 tabular-nums text-accent2">{money(it.price)}</span>
                </div>
                <div className="text-[11px] text-muted">
                  {it.code} · {it.source}
                  {it.group ? ` · ${it.group}` : ''}
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
