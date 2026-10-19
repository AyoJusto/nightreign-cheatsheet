import type { Effect, EffectGroup, EffectPool } from './loadout'
import { EFFECTS } from './data/effects'
import { normalize } from './text'

// Effect text is left out of the index: players type what the game showed them,
// and the effect column would make "attack" or "stack" match rows whose titles never say so.
const TITLES = EFFECTS.map((e) => normalize(e.title))
const KEYWORDS = EFFECTS.map((e) => (e.keywords ? normalize(e.keywords) : ''))

const byTitle = (a: Effect, b: Effect) => a.title.localeCompare(b.title, 'en')

export function searchEffects(query: string): Effect[] {
  const q = normalize(query)
  if (!q) return []
  const titleHits: { effect: Effect; position: number }[] = []
  const keywordHits: Effect[] = []
  EFFECTS.forEach((effect, i) => {
    const position = TITLES[i]!.indexOf(q)
    if (position >= 0) titleHits.push({ effect, position })
    else if (KEYWORDS[i]!.includes(q)) keywordHits.push(effect)
  })
  titleHits.sort((a, b) => a.position - b.position || byTitle(a.effect, b.effect))
  keywordHits.sort(byTitle)
  return [...titleHits.map((hit) => hit.effect), ...keywordHits]
}

export const POOL_TAG: Record<EffectPool, string | null> = {
  base: null,
  deep: 'Deep',
  dormant: 'Dormant',
}

const GROUP_LABEL: Record<EffectGroup, string> = {
  relics: 'Relic effects',
  weapons: 'Weapon effects',
}

export const effectsIn = (group: EffectGroup): Effect[] => EFFECTS.filter((e) => e.group === group)

export const GROUPS: { id: EffectGroup; label: string; count: number }[] = (['relics', 'weapons'] as const).map(
  (id) => ({ id, label: GROUP_LABEL[id], count: effectsIn(id).length }),
)

export function byCategory(list: Effect[]): { cat: string; items: Effect[] }[] {
  const groups = new Map<string, Effect[]>()
  for (const e of list) {
    const primaryCategory = e.cats[0] ?? 'Other'
    const items = groups.get(primaryCategory)
    if (items) items.push(e)
    else groups.set(primaryCategory, [e])
  }
  return [...groups].sort((a, b) => b[1].length - a[1].length).map(([cat, items]) => ({ cat, items }))
}

export type StackTone = 'yes' | 'no' | 'unknown'

export function stackLabel(stack: string): { label: string; tone: StackTone } {
  if (stack === 'Yes') return { label: 'Stacks', tone: 'yes' }
  if (stack === 'No') return { label: 'No stack', tone: 'no' }
  if (!stack || stack === '-') return { label: 'Unknown', tone: 'unknown' }
  return { label: stack, tone: 'unknown' }
}
