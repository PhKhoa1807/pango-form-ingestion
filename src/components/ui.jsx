// Các thành phần UI dùng lại — gói style Tailwind cho gọn.

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl border border-line bg-card p-[18px] ${className}`}>{children}</div>
  )
}

export function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="mb-[5px] block text-xs text-muted">
        {label} {required && <span className="text-err">*</span>}
      </label>
      {children}
      {hint && <div className="mt-1 text-[11px] text-muted">{hint}</div>}
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-line bg-card2 px-[11px] py-[9px] text-txt ' +
  'outline-none focus:border-accent placeholder:text-muted/70'

export function TextInput(props) {
  return <input {...props} className={`${inputCls} ${props.className || ''}`} />
}

export function Button({ variant = 'primary', className = '', ...props }) {
  const base =
    'rounded-lg px-[18px] py-[10px] font-semibold cursor-pointer disabled:opacity-50 ' +
    'disabled:cursor-not-allowed transition-colors'
  const variants = {
    primary: 'bg-accent text-white border-none hover:bg-accent2',
    ghost: 'bg-transparent border border-line text-txt hover:border-accent hover:bg-card2',
  }
  return <button {...props} className={`${base} ${variants[variant]} ${className}`} />
}
