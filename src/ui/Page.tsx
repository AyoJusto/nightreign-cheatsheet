import type { ReactNode } from 'react'
import { Icon } from './Icon'
import { goBack } from './router'
import { HomeLink, TopBar } from './TopBar'

export type Go = (path: string, back?: boolean) => void

export function Page({ title, go, back = '/', children }: { title: string; go: Go; back?: string; children: ReactNode }) {
  return (
    <main className="page mx-auto box-border min-h-dvh max-w-3xl px-4 pt-[calc(var(--safe-top)+76px)] pb-[calc(var(--safe-bottom)+32px)]">
      <TopBar className="pill-page" onBack={() => goBack(back, go)} trailing={back !== '/' && <HomeLink />} />
      <h1 className="mx-1 mt-0 mb-5 text-[32px] leading-tight font-bold">{title}</h1>
      {children}
    </main>
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
  return <ul className={`surface m-0 list-none overflow-hidden rounded-card p-0 ${className}`}>{children}</ul>
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
