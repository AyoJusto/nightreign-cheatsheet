import { assess } from '../bestiary/assess'
import { bestiary, headline, nightlordHeadline } from '../bestiary/bestiary'
import type { Enemy } from '../bestiary/enemy'
import { catalog } from '../data/catalog'
import { DAMAGE_NAMES, NIGHTLORDS, type NightlordId } from '../domain/names'
import { AfflictionIcon, NumbersTable, WeakIcons } from './EnemyNumbers'
import { Group, LinkRow, Page, Section, type Go } from './Page'

function RowWeakIcons({ enemy, nightlord }: { enemy: Enemy; nightlord?: boolean }) {
  if (!enemy.forms.length) return null
  const weak = nightlord ? nightlordHeadline(bestiary.nightlord(enemy.id)!).weak : headline(enemy).weak
  const shown = weak.length ? weak : assess(enemy.forms).oneForm?.weakTo ?? []
  return (
    <span role="img" className="flex shrink-0 gap-1" aria-label={shown.length ? `Weak to ${shown.map((k) => DAMAGE_NAMES[k]).join(', ')}` : 'No damage weakness'}>
      {shown.map((k) => <AfflictionIcon key={k} affliction={k} />)}
    </span>
  )
}

export function EnemyRow({ enemy, href = `#/enemy/${enemy.id}`, nightlord }: { enemy: Enemy; href?: string; nightlord?: boolean }) {
  return <LinkRow href={href} trailing={<RowWeakIcons enemy={enemy} nightlord={nightlord} />}>{enemy.name}</LinkRow>
}

export function NightlordsPage({ go }: { go: Go }) {
  return (
    <Page title="Nightlords" go={go}>
      <Group>
        {NIGHTLORDS.map(({ id, name }) => (
          <LinkRow key={id} href={`#/nightlord/${id}`} trailing={<RowWeakIcons enemy={bestiary.nightlord(id)!} nightlord />}>
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
    <Page
      title={nightlord.name}
      go={go}
      back="/nightlords"
      art={`nightlords/${id}.webp`}
      meta={<WeakIcons forms={nightlord.forms} named={nightlord.named} center />}
      wide
    >
      <div className="grid items-start gap-x-7 min-[900px]:grid-cols-2">
        <NumbersTable forms={nightlord.forms} />
        {([1, 2] as const).map((n) => (
          <Section key={n} title={`Night ${n}`}>
            <Group>{nights[n].map((e) => <EnemyRow key={e.id} enemy={e} />)}</Group>
          </Section>
        ))}
      </div>
    </Page>
  )
}
