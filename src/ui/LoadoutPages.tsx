import { useDeferredValue, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { byCategory, effectsIn, POOL_TAG, searchEffects, stackLabel, type StackTone } from '../loadout/effects'
import { BUILDS, BY_CHARACTER, describe, groupSlots } from '../loadout/builds'
import type { BuildLine, BuildSlot, Effect, EffectGroup } from '../loadout/loadout'
import { Icon } from './Icon'
import { CHEVRON_TURN, staggered, useMotion } from './motion'
import { Group, LinkRow, Page, Section, type Go } from './Page'
import { SearchField } from './SearchField'
import { useKept } from './router'

const STACK_TONE: Record<StackTone, string> = { yes: 'text-label', no: 'text-label-2', unknown: 'text-label-2' }
export const GROUP_TITLES: Record<EffectGroup, string> = { relics: 'Relic Effects', weapons: 'Weapon Effects' }

function Disclosure({ open }: { open: boolean }) {
  const m = useMotion()
  return (
    <motion.span className="mt-1 flex shrink-0 text-label-3" initial={false} animate={{ rotate: open ? CHEVRON_TURN : 0 }} transition={m.small}>
      <Icon name="chevron" size={14} />
    </motion.span>
  )
}

function Details({ open, children }: { open: boolean; children: ReactNode }) {
  const m = useMotion()
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div key="details" className="overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }} transition={{ ...m.layout, opacity: m.fade }}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function EffectRow({ effect, index }: { effect: Effect; index: number }) {
  const m = useMotion()
  const [open, setOpen] = useState(false)
  const stack = stackLabel(effect.stack)
  const pool = POOL_TAG[effect.pool]
  return (
    <motion.li {...staggered(m, index)} className="shadow-[inset_0_-0.5px_0_var(--color-separator)] last:shadow-none">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-2 px-4 py-3 text-left hover:bg-fill">
        <Disclosure open={open} />
        <span className="min-w-0 flex-1 text-base [overflow-wrap:anywhere]">{effect.title}</span>
        <span className="shrink-0 text-right text-[13px] leading-5">
          <span className={STACK_TONE[stack.tone]}>{stack.label}</span>
          {pool && <span className="block text-label-2">{pool}</span>}
        </span>
      </button>
      <Details open={open}>
        <div className="px-4 pb-3 pl-10 text-[15px] leading-snug text-label-2">
          <p className="m-0 text-label">{effect.effect}</p>
          {effect.notes && <p className="m-0 mt-1.5">{effect.notes}</p>}
        </div>
      </Details>
    </motion.li>
  )
}

export function EffectsPage({ group, go }: { group: EffectGroup; go: Go }) {
  const [query, setQuery] = useKept('query', '')
  const settledQuery = useDeferredValue(query)
  const found = settledQuery.trim() ? searchEffects(settledQuery).filter((e) => e.group === group) : null
  const list = found ?? effectsIn(group)
  return (
    <Page title={GROUP_TITLES[group]} go={go}>
      <SearchField label="Filter" placeholder="Text on the relic" value={query} onChange={setQuery} />
      {found ? (
        <Group className="mt-4">{list.map((e, i) => <EffectRow key={`${e.pool}:${e.title}`} effect={e} index={i} />)}</Group>
      ) : (
        byCategory(list).map(({ cat, items }) => (
          <Section key={cat} title={cat}>
            <Group>{items.map((e, i) => <EffectRow key={`${e.pool}:${e.title}`} effect={e} index={i} />)}</Group>
          </Section>
        ))
      )}
      {list.length === 0 && <p className="mx-1 mt-4 text-label-2">Nothing matches.</p>}
    </Page>
  )
}

function Line({ line, index }: { line: BuildLine; index: number }) {
  const m = useMotion()
  const [open, setOpen] = useState(false)
  const effect = describe(line.effect)
  return (
    <motion.li {...staggered(m, index)} className="shadow-[inset_0_-0.5px_0_var(--color-separator)] last:shadow-none">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-2 px-4 py-2.5 text-left hover:bg-fill">
        <Disclosure open={open} />
        <span className="min-w-0 flex-1 text-base">
          {line.as ?? line.effect}
          {(line.curses ?? []).map((c) => <span key={c} className="block text-[15px] text-immune">{c}</span>)}
        </span>
      </button>
      <Details open={open}>
        <p className="m-0 px-4 pb-3 pl-10 text-[15px] leading-snug text-label-2">{effect?.effect ?? 'No effect text in the sheet.'}</p>
      </Details>
    </motion.li>
  )
}

function Slots({ title, slots }: { title: string; slots: BuildSlot[] }) {
  if (!slots.length) return null
  return (
    <Section title={title}>
      <div className="flex flex-col gap-3">
        {groupSlots(slots).flatMap((g) => g.options.map((slot, i) => (
          <div key={`${g.n}:${i}`}>
            <h3 className="mx-4 mb-1.5 text-[15px] font-semibold">{slot.label ?? `${title === 'Relics' ? 'Relic' : 'Deep'} ${g.n}`}</h3>
            <Group>{slot.lines.map((l, i) => <Line key={l.effect + (l.as ?? '')} line={l} index={i} />)}</Group>
          </div>
        )))}
      </div>
    </Section>
  )
}

export function BuildsPage({ character, go }: { character: string | null; go: Go }) {
  const builds = character ? BY_CHARACTER.get(character) : undefined
  const [picked, setPicked] = useKept('build', 0)
  if (!builds) {
    return (
      <Page title="Builds" go={go}>
        <Group>{BUILDS.map((c, i) => <LinkRow key={c.slug} href={`#/builds/${c.slug}`} index={i}>{c.name}</LinkRow>)}</Group>
      </Page>
    )
  }
  const build = builds.builds[Math.min(picked, builds.builds.length - 1)]
  return (
    <Page title={builds.name} go={go} back="/builds">
      {builds.builds.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Build">
          {builds.builds.map((b, i) => (
            <button key={b.name} type="button" aria-pressed={b === build} onClick={() => setPicked(i)}
              className="min-h-11 rounded-full px-4 text-[15px] text-label-2 surface aria-pressed:bg-fill-strong aria-pressed:font-semibold aria-pressed:text-label">
              {b.name}
            </button>
          ))}
        </div>
      )}
      <Slots title="Relics" slots={build.relics} />
      <Slots title="Depth Relics" slots={build.deep} />
    </Page>
  )
}
