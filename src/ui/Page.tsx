import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { FadeImg } from './FadeImg'
import { Icon } from './Icon'
import { staggered, useMotion } from './motion'
import { goBack } from './router'
import { HomeLink, TopBar } from './TopBar'

export type Go = (path: string, back?: boolean) => void

export function Page({ title, go, back = '/', art, meta, wide, children }: {
  title: string
  go: Go
  back?: string
  art?: string
  meta?: ReactNode
  wide?: boolean
  children: ReactNode
}) {
  const width = wide ? 'max-w-5xl' : 'max-w-3xl'
  const heading = <h1 data-hero="title" className="mx-1 my-0 w-fit font-display text-[40px] leading-none font-bold min-[900px]:text-[52px]">{title}</h1>
  return (
    <main className={`page mx-auto box-border min-h-dvh ${width} px-4 pt-[calc(var(--safe-top)+76px)] pb-[calc(var(--safe-bottom)+32px)]`}>
      <TopBar onBack={() => goBack(back, go)} trailing={back !== '/' && <HomeLink />} />
      {art ? (
        <header className="mb-5 flex flex-col items-center text-center">
          <FadeImg
            data-hero="art"
            src={art}
            alt=""
            width={150}
            height={150}
            className="mb-4 size-[150px] rounded-full shadow-[0_0_0_1px_var(--color-hairline)] min-[900px]:size-[190px]"
            draggable={false}
          />
          {heading}
          {meta}
        </header>
      ) : (
        <header className="mb-5">
          {heading}
          {meta}
        </header>
      )}
      {children}
    </main>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mx-1 mb-2.5 font-display text-[22px] font-semibold text-label">{title}</h2>
      {children}
    </section>
  )
}

export function Group({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <ul className={`surface m-0 list-none overflow-hidden rounded-card p-0 ${className}`}>{children}</ul>
}

export function LinkRow({ href, index, children, trailing }: { href: string; index: number; children: ReactNode; trailing?: ReactNode }) {
  const m = useMotion()
  return (
    <motion.li {...staggered(m, index)} className="shadow-[inset_0_-0.5px_0_var(--color-separator)] last:shadow-none">
      <a href={href} className="flex min-h-[52px] items-center gap-3 px-4 py-2 text-[17px] hover:bg-fill">
        <span className="min-w-0 flex-1">{children}</span>
        {trailing}
        <Icon name="chevron" size={16} className="shrink-0 text-label-3" />
      </a>
    </motion.li>
  )
}
