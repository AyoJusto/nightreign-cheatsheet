import { useId } from 'react'
import { Icon } from './Icon'

// Input text stays 16px or more: iOS Safari zooms into a smaller input and never zooms back out.
export function SearchField({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  const id = useId()
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">{label}</label>
      <Icon name="search" size={18} className="pointer-events-none absolute top-[15px] left-4 z-10 text-label-2" />
      <input id={id} type="search" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} autoComplete="off"
        className="surface box-border h-12 w-full rounded-control border-0 pr-4 pl-11 text-[17px] text-label outline-none placeholder:text-label-2 focus:shadow-[var(--glass-rim),0_0_0_2px_var(--color-highlight)]" />
    </div>
  )
}
