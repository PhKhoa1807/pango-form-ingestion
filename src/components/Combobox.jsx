import { useEffect, useMemo, useRef, useState } from 'react'

// Bỏ dấu tiếng Việt để search "gõ tới đâu lọc tới đó" không cần đúng dấu.
const norm = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')

const sizes = {
  md: 'px-[11px] py-[9px] text-[14px]',
  sm: 'px-[9px] py-[6px] text-[13px]',
}

// Ô vừa gõ-để-tìm vừa chọn từ danh sách (autocomplete).
//  options: [{ code, name }]; value = code đang chọn; onChange(code, name).
export function Combobox({
  value,
  onChange,
  options,
  placeholder = '',
  disabled = false,
  size = 'md',
}) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)

  const selected = options.find((o) => String(o.code) === String(value))

  // Đồng bộ ô nhập khi chọn từ ngoài (autofill khách cũ) hoặc khi reset form.
  useEffect(() => {
    setText(selected ? selected.name : '')
  }, [selected?.code])

  // Lọc theo chuỗi đang gõ (không phân biệt hoa/thường, có/không dấu).
  const filtered = useMemo(() => {
    const q = norm(text.trim())
    if (!q) return options
    return options.filter((o) => norm(o.name).includes(q))
  }, [text, options])

  // Click ra ngoài -> đóng danh sách, trả ô nhập về tên đang chọn.
  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false)
        setText(selected ? selected.name : '')
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [selected])

  const pick = (o) => {
    onChange(String(o.code), o.name)
    setText(o.name)
    setOpen(false)
  }

  const cls =
    'w-full rounded-lg border border-line bg-card2 text-txt outline-none ' +
    'focus:border-accent placeholder:text-muted/70 disabled:cursor-not-allowed ' +
    `disabled:opacity-60 ${sizes[size]}`

  return (
    <div ref={boxRef} className="relative">
      <input
        type="text"
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        className={cls}
        onChange={(e) => {
          setText(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
      />
      {open && !disabled && (
        // preventDefault trên mousedown để bấm chọn không làm input mất focus trước onClick.
        <ul
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-line bg-card shadow-md"
          onMouseDown={(e) => e.preventDefault()}
        >
          {filtered.length === 0 ? (
            <li className="px-[11px] py-[7px] text-[13px] text-muted">Không tìm thấy</li>
          ) : (
            filtered.map((o) => (
              <li
                key={o.code}
                onClick={() => pick(o)}
                className={`cursor-pointer px-[11px] py-[7px] text-[13px] hover:bg-card2 ${
                  String(o.code) === String(value) ? 'bg-accent/10 font-semibold text-accent2' : ''
                }`}
              >
                {o.name}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
