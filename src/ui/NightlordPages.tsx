import { assess } from '../bestiary/assess'
import { bestiary, headline, nightlordHeadline } from '../bestiary/bestiary'
import type { Enemy } from '../bestiary/enemy'
import { catalog } from '../data/catalog'
import { NIGHTLORDS, type NightlordId } from '../domain/names'
import { AfflictionIcon, NumbersTable, WeakTo } from './EnemyNumbers'
import { Group, LinkRow, Page, Section, type Go } from './Page'

function WeakIcons({ enemy, nightlord }: { enemy: Enemy; nightlord?: boolean }) {
  if (!enemy.forms.length) return null
  const weak = nightlord ? nightlordHeadline(bestiary.nightlord(enemy.id)!).weak : headline(enemy).weak
  const shown = weak.length ? weak : assess(enemy.forms).oneForm?.weakTo ?? []
  return (
    <span className="flex shrink-0 gap-1" aria-label={shown.length ? undefined : 'No damage weakness'}>
      {shown.map((k) => <AfflictionIcon key={k} affliction={k} />)}
    </span>
  )
}

export function EnemyRow({ enemy, href = `#/enemy/${enemy.id}` }: { enemy: Enemy; href?: string }) {
  return <LinkRow href={href} trailing={<WeakIcons enemy={enemy} />}>{enemy.name}</LinkRow>
}

export function NightlordsPage({ go }: { go: Go }) {
  return (
    <Page title="Nightlords" go={go}>
      <Group>
        {NIGHTLORDS.map(({ id, name }) => (
          <LinkRow key={id} href={`#/nightlord/${id}`} trailing={<WeakIcons enemy={bestiary.nightlord(id)!} nightlord />}>
            <span className="flex items-center gap-3">
              <img src={`nightlords/${id}.webp`} alt="" width={40} height={40} className="rounded-full" draggable={false} />
              {name}
            </span>
          </LinkRow>
        ))}
      </Group>
    </Page>
  )
}

export function NightlordPage({ id, go }: { id: NightlordId; go: Go }) {
  const nightlord = bestiary.nightlord(id)!
  const nights = catalog.nightBossesOf(id)
  return (
    <Page title={nightlord.name} go={go} back="/nightlords">
      <WeakTo forms={nightlord.forms} named={nightlord.named} />
      {([1, 2] as const).map((n) => (
        <Section key={n} title={`Night ${n}`}>
          <Group>{nights[n].map((e) => <EnemyRow key={e.id} enemy={e} />)}</Group>
        </Section>
      ))}
      <NumbersTable forms={nightlord.forms} />
    </Page>
  )
}
