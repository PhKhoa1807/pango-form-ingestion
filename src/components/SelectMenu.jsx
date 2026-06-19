import { useEffect, useRef, useState } from 'react'

const sizes = {
  md: 'px-[11px] py-[9px] text-[14px]',
  sm: 'px-[9px] py-[6px] text-[13px]',
}

// Dropdown chọn 1 giá trị — mở khi click, style giống ô Mã SP (ProductPicker).
//  options: [{ value, label }]; value = giá trị đang chọn; onChange(value).
export function SelectMenu({ value, onChange, options, placeholder = 'Chọn...', size = 'md', disabled }) {
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)
  const selected = options.find((o) => o.value === value)

  // Click ra ngoài -> đóng (pointerdown capture để không bị React Aria nuốt sự kiện).
  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDoc, true)
    return () => document.removeEventListener('pointerdown', onDoc, true)
  }, [])

  const pick = (v) => {
    onChange(v)
    setOpen(false)
  }

  const cls =
    'flex w-full items-center justify-between rounded-lg border border-line bg-card2 text-txt outline-none ' +
    'focus:border-accent disabled:cursor-not-allowed disabled:opacity-60 ' +
    `${sizes[size]}`

  return (
    <div ref={boxRef} className="relative">
      <button type="button" disabled={disabled} className={cls} onClick={() => setOpen((o) => !o)}>
        <span className={selected ? 'text-txt' : 'text-muted/70'}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="ml-2 text-muted">▾</span>
      </button>
      {open && !disabled && (
        <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-line bg-card shadow-md">
          {options.map((o) => (
            <li
              key={o.value}
              onClick={() => pick(o.value)}
              className={`cursor-pointer px-[11px] py-[7px] text-[13px] hover:bg-card2 ${
                o.value === value ? 'bg-accent/10 font-semibold text-accent2' : ''
              }`}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
