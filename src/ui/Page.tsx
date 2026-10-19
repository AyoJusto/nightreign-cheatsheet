import type { ReactNode } from 'react'
import { Icon } from './Icon'
import { goBack } from './router'

export type Go = (path: string, back?: boolean) => void

const circle = 'glass grid size-11 place-items-center rounded-full text-label'

export function Page({ title, go, back = '/', children }: { title: string; go: Go; back?: string; children: ReactNode }) {
  return (
    <main className="page mx-auto box-border min-h-dvh max-w-3xl px-4 pt-[calc(var(--safe-top)+12px)] pb-[calc(var(--safe-bottom)+32px)]">
      <nav className="flex items-center justify-between" aria-label="Page">
        <BackButton go={go} fallback={back} />
        {back !== '/' && <a href="#/" className={circle} aria-label="Home"><HomeGlyph /></a>}
      </nav>
      <h1 className="mx-1 mt-4 mb-5 text-[32px] leading-tight font-bold">{title}</h1>
      {children}
    </main>
  )
}

export function BackButton({ go, fallback }: { go: Go; fallback: string }) {
  return <button type="button" className={circle} aria-label="Back" onClick={() => goBack(fallback, go)}><Icon name="back" /></button>
}

function HomeGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
    </svg>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mx-4 mb-2 text-[13px] font-semibold tracking-wide text-label-2 uppercase">{title}</h2>
      {children}
    </section>
  )
}

export function Group({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <ul className={`glass-flat m-0 list-none overflow-hidden rounded-card p-0 ${className}`}>{children}</ul>
}

export function LinkRow({ href, children, trailing }: { href: string; children: ReactNode; trailing?: ReactNode }) {
  return (
    <li className="shadow-[inset_0_-0.5px_0_var(--color-separator)] last:shadow-none">
      <a href={href} className="flex min-h-[52px] items-center gap-3 px-4 py-2 text-[17px] hover:bg-fill">
        <span className="min-w-0 flex-1">{children}</span>
        {trailing}
        <Icon name="chevron" size={16} className="shrink-0 text-label-3" />
      </a>
    </li>
  )
}
