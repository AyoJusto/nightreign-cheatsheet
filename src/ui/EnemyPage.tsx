import { bestiary } from '../bestiary/bestiary'
import { catalog } from '../data/catalog'
import { nightlordName } from '../domain/names'
import { NumbersTable, WeakTo } from './EnemyNumbers'
import { Group, LinkRow, Page, Section, type Go } from './Page'

const nightsPhrase = (nights: (1 | 2)[]) => nights.map((n) => `Night ${n}`).join(' and ')

export function EnemyPage({ id, go }: { id: string; go: Go }) {
  const enemy = bestiary.enemy(id)!
  const runs = catalog.nightsOf(enemy.id)
  return (
    <Page title={enemy.name} go={go} back="/bosses">
      {enemy.forms.length ? (
        <>
          <WeakTo forms={enemy.forms} />
          <NumbersTable forms={enemy.forms} />
        </>
      ) : (
        <p className="surface m-0 rounded-card px-5 py-4 text-label-2">No numbers for this one yet.</p>
      )}
      {runs.length > 0 && (
        <Section title="Expeditions">
          <Group>
            {runs.map((r) => (
              <LinkRow key={r.nightlord} href={`#/nightlord/${r.nightlord}`} trailing={<span className="text-[15px] text-label-2">{nightsPhrase(r.nights)}</span>}>
                {nightlordName(r.nightlord)}
              </LinkRow>
            ))}
          </Group>
        </Section>
      )}
    </Page>
  )
}
