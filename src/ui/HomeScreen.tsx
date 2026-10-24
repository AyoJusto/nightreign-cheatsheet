import { memo, useDeferredValue, useState, type ReactNode } from 'react'
import { bestiary } from '../bestiary/bestiary'
import type { Enemy } from '../bestiary/enemy'
import { searchEffects } from '../loadout/effects'
import { normalize } from '../loadout/text'
import { Icon } from './Icon'
import { EffectRow, GROUP_TITLES } from './LoadoutPages'
import { EnemyRow } from './NightlordPages'
import { Group, LinkRow, Page, Section, type Go } from './Page'
import { PICK_PATH } from './router'
import { SearchField } from './SearchField'

const ENEMIES_AND_NIGHTLORDS: { enemy: Enemy; href: string }[] = [
  ...bestiary.nightlords.map((n) => ({ enemy: n as Enemy, href: `#/nightlord/${n.id}` })),
  ...bestiary.all.map((e) => ({ enemy: e, href: `#/enemy/${e.id}` })),
]

export const findEnemies = (query: string) => {
  const q = normalize(query)
  if (!q) return []
  return ENEMIES_AND_NIGHTLORDS
    .map((entry) => ({ ...entry, at: normalize(entry.enemy.name).indexOf(q) }))
    .filter((entry) => entry.at >= 0)
    .sort((a, b) => a.at - b.at || a.enemy.name.localeCompare(b.enemy.name))
}

export function BossesPage({ go }: { go: Go }) {
  const [query, setQuery] = useState('')
  const settledQuery = useDeferredValue(query)
  const shown = settledQuery.trim() ? findEnemies(settledQuery).filter((e) => !e.href.includes('nightlord')).map((e) => e.enemy) : bestiary.all
  return (
    <Page title="Bosses" go={go}>
      <SearchField label="Filter bosses" placeholder="Name" value={query} onChange={setQuery} />
      <Group className="mt-4">{shown.map((e) => <EnemyRow key={e.id} enemy={e} />)}</Group>
      {!shown.length && <p className="mx-1 mt-4 text-label-2">Nothing matches.</p>}
    </Page>
  )
}

const LINKS: [string, string][] = [
  ['Nightlords', '#/nightlords'],
  ['Bosses', '#/bosses'],
  ['Relic Effects', '#/effects/relics'],
  ['Weapon Effects', '#/effects/weapons'],
  ['Builds', '#/builds'],
]

const FIRST_RESULTS = 20

function Capped<T>({ items, render }: { items: T[]; render: (item: T) => ReactNode }) {
  const [all, setAll] = useState(false)
  const shown = all ? items : items.slice(0, FIRST_RESULTS)
  return (
    <>
      <Group>{shown.map(render)}</Group>
      {shown.length < items.length && (
        <button type="button" onClick={() => setAll(true)} className="mx-4 mt-2 min-h-11 text-[15px] font-semibold text-label">
          Show all {items.length}
        </button>
      )}
    </>
  )
}

const Results = memo(function Results({ query }: { query: string }) {
  const enemies = findEnemies(query)
  const effects = searchEffects(query)
  return (
    <div>
      {enemies.length > 0 && (
        <Section title="Bosses">
          <Capped items={enemies} render={({ enemy, href }) => <EnemyRow key={href} enemy={enemy} href={href} nightlord={href.startsWith('#/nightlord/')} />} />
        </Section>
      )}
      {(['relics', 'weapons'] as const).map((group) => {
        const found = effects.filter((e) => e.group === group)
        return found.length ? (
          <Section key={group} title={GROUP_TITLES[group]}>
            <Capped items={found} render={(e) => <EffectRow key={`${e.pool}:${e.title}`} effect={e} />} />
          </Section>
        ) : null
      })}
      {!enemies.length && !effects.length && <p className="mx-1 text-label-2">Nothing matches.</p>}
    </div>
  )
})

export function HomeScreen() {
  const [query, setQuery] = useState('')
  const settledQuery = useDeferredValue(query)
  const searching = query.trim().length > 0
  return (
    <main className="home-screen mx-auto box-border flex min-h-dvh max-w-3xl flex-col gap-4 px-4 pt-[calc(var(--safe-top)+40px)] pb-[calc(var(--safe-bottom)+24px)]">
      <h1 className="mx-1 my-0 font-display text-[44px] leading-none font-bold min-[900px]:text-[56px]">Nightreign</h1>
      <SearchField label="Search bosses and relic effects" placeholder="Bosses, relic effects" value={query} onChange={setQuery} />
      {searching ? (
        <Results key={settledQuery} query={settledQuery} />
      ) : (
        <>
          <a href={`#${PICK_PATH}`}
            className="find-my-seed glass relative mt-2 box-border flex h-48 w-full items-end overflow-hidden rounded-[32px] p-5 text-left">
            <img src="maps/default.webp" alt="" className="pointer-events-none absolute top-1/2 left-1/2 w-[130%] max-w-none -translate-x-1/2 -translate-y-[42%] opacity-70" draggable={false} />
            <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgb(0_0_0/0.75),transparent_65%)]" aria-hidden />
            <span className="relative flex w-full items-center justify-between text-[24px] font-semibold">
              Find My Seed
              <Icon name="chevron" size={22} />
            </span>
          </a>
          <Group>
            {LINKS.map(([label, href]) => <LinkRow key={href} href={href}>{label}</LinkRow>)}
          </Group>
          <a href="#/about" className="mt-auto self-center px-4 py-3 text-[15px] text-label-2">About</a>
        </>
      )}
    </main>
  )
}
