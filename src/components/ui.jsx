// Các thành phần UI dùng lại — gói style Tailwind cho gọn.

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl border border-line bg-card p-[18px] shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="mb-[5px] block text-[13px] font-semibold text-txt">
        {label} {required && <span className="text-err">*</span>}
      </label>
      {children}
      {hint && <div className="mt-1 text-[11px] text-muted">{hint}</div>}
    </div>
  )
}

const inputBase =
  'w-full rounded-lg border border-line bg-card2 text-txt ' +
  'outline-none focus:border-accent placeholder:text-muted/70'
const inputSizes = {
  md: 'px-[11px] py-[9px] text-[14px]',
  sm: 'px-[9px] py-[6px] text-[13px]',
}

export function TextInput({ size = 'md', className = '', ...props }) {
  return <input {...props} className={`${inputBase} ${inputSizes[size]} ${className}`} />
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  const base =
    'rounded-lg font-semibold cursor-pointer disabled:opacity-50 ' +
    'disabled:cursor-not-allowed transition-colors'
  const sizes = {
    md: 'px-[18px] py-[10px]',
    sm: 'px-[12px] py-[6px] text-[13px]',
  }
  const variants = {
    primary: 'bg-accent text-white border-none shadow-sm hover:bg-accent2 hover:shadow-md',
    lime: 'bg-[#A0E870] text-[#1f2933] border-none shadow-sm hover:bg-[#8fdd5c] hover:shadow-md',
    ghost: 'bg-transparent border border-line text-txt hover:border-accent hover:bg-card2',
  }
  return <button {...props} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} />
}
