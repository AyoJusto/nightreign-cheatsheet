import { useLayoutEffect, useRef, type ReactNode, type Ref } from 'react'
import { animate } from 'motion/react'
import { Plate } from './Plate'
import { Icon } from './Icon'
import { useMotion } from './motion'

export function TopBar({ onBack, children, trailing, className = '', ref }: {
  onBack: () => void; children?: ReactNode; trailing?: ReactNode; className?: string; ref?: Ref<HTMLDivElement>
}) {
  const m = useMotion()
  const leading = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const parts = [...(leading.current?.parentElement?.children ?? [])] as HTMLElement[]
    if (!parts.length) return
    parts.forEach((part) => { part.style.opacity = '0' })
    const fadeIn = animate(parts, { opacity: 1 }, m.fade)
    return () => fadeIn.stop()
  }, [])
  const back = <button className="pill-back" aria-label="Back" onClick={onBack}><Icon name="back" /></button>
  if (children === undefined) {
    return (
      <>
        <Plate className="pill pill-solo" ref={ref}>{back}</Plate>
        {trailing && <Plate className="pill pill-solo pill-solo-end">{trailing}</Plate>}
      </>
    )
  }
  return (
    <Plate className={`pill ${className}`} ref={ref}>
      <div className="pill-leading" ref={leading}>{back}</div>
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
