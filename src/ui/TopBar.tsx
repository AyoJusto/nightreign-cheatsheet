import type { ReactNode, Ref } from 'react'
import { Plate } from './Plate'
import { Icon } from './Icon'

/** The one top bar every screen but Home wears: Back first, always in the same place, then the screen's own controls. */
export function TopBar({ onBack, children, trailing, className = '', ref }: {
  onBack: () => void; children?: ReactNode; trailing?: ReactNode; className?: string; ref?: Ref<HTMLDivElement>
}) {
  return (
    <Plate className={`pill ${className}`} ref={ref}>
      <div className="pill-leading">
        <button className="pill-back" aria-label="Back" onClick={onBack}><Icon name="back" /></button>
      </div>
      {children}
      {trailing && <div className="pill-trailing">{trailing}</div>}
    </Plate>
  )
}

export function HomeLink() {
  return (
    <a href="#/" aria-label="Home">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
        <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
      </svg>
    </a>
  )
}
