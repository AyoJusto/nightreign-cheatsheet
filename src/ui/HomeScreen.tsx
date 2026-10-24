import { memo, useDeferredValue, useState, type ReactNode } from 'react'
import { bestiary } from '../bestiary/bestiary'
import type { Enemy } from '../bestiary/enemy'
import { searchEffects } from '../loadout/effects'
import { normalize } from '../loadout/text'
import { Icon, type IconName } from './Icon'
import { EffectRow, GROUP_TITLES } from './LoadoutPages'
import { EnemyRow } from './NightlordPages'
import { PICKS, Portrait } from './NightlordPicker'
import { Group, Page, Section, type Go } from './Page'
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

const LINKS: [string, string, IconName][] = [
  ['Nightlords', '#/nightlords', 'moon'],
  ['Bosses', '#/bosses', 'swords'],
  ['Relic Effects', '#/effects/relics', 'relic'],
  ['Weapon Effects', '#/effects/weapons', 'weapon'],
  ['Builds', '#/builds', 'builds'],
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
    <main className="home-screen mx-auto box-border flex min-h-dvh max-w-5xl flex-col gap-4 px-4 pt-[calc(var(--safe-top)+40px)] pb-[calc(var(--safe-bottom)+24px)]">
      <div className="flex flex-col gap-4 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between">
        <h1 className="mx-1 my-0 font-display text-[44px] leading-none font-bold min-[900px]:text-[56px]">Nightreign</h1>
        <div className="min-[900px]:w-[380px]">
          <SearchField label="Search bosses and relic effects" placeholder="Bosses, relic effects" value={query} onChange={setQuery} />
        </div>
      </div>
      {searching ? (
        <Results key={settledQuery} query={settledQuery} />
      ) : (
        <>
          <section aria-labelledby="find-heading" className="mt-2">
            <h2 id="find-heading" className="mx-1 mt-0 mb-3 font-display text-[26px] font-semibold min-[900px]:text-[32px]">Find My Seed</h2>
            <ul className="-mx-4 my-0 flex list-none gap-3 overflow-x-auto px-4 min-[900px]:mx-0 min-[900px]:grid min-[900px]:grid-cols-[repeat(auto-fill,minmax(88px,1fr))] min-[900px]:gap-3.5 min-[900px]:overflow-visible min-[900px]:px-0">
              {PICKS.map(({ id, name }) => (
                <li key={id} className="w-[72px] shrink-0 text-center text-[12px] min-[900px]:w-auto min-[900px]:text-[13px]">
                  <a href={`#/find/${id}`} className="block">
                    <span className="home-medallion"><Portrait id={id} name={name} /></span>
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          </section>
          <nav className="grid grid-cols-2 gap-3 min-[900px]:grid-cols-5">
            {LINKS.map(([label, href, icon]) => (
              <a key={href} href={href}
                className={`surface flex h-[108px] flex-col justify-between rounded-[18px] p-4 min-[900px]:h-[120px]${icon === 'builds' ? ' col-span-2 min-[900px]:col-span-1' : ''}`}>
                <Icon name={icon} className="text-accent" />
                <span className="font-display text-[22px] font-semibold">{label}</span>
              </a>
            ))}
          </nav>
          <a href="#/about" className="mt-auto self-center px-4 py-3 text-[15px] text-label-2">About</a>
        </>
      )}
    </main>
  )
}
