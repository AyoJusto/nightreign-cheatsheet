import { DAMAGE_TYPES, STATUSES, type Buildup, type DamageType, type Form, type Negation, type Status } from './enemy'

export interface Assessment {
  negation: Negation
  buildup: Buildup
  weakTo: DamageType[]
  weakBy: number | null
  resists: DamageType[]
  fastest: Status[]
  fastestAt: number | null
  weakStatuses: Status[]
  immuneTo: Status[]
  oneForm: { label: string | null; weakTo: DamageType[]; by: number } | null
}

const tiedAt = <K extends string>(keys: readonly K[], value: (k: K) => number, target: number) =>
  keys.filter((k) => value(k) === target).sort()

export function assess(forms: Form[]): Assessment {
  const negation = Object.fromEntries(DAMAGE_TYPES.map((t) => [t, Math.max(...forms.map((f) => f.negation[t]))])) as Negation
  const buildup = Object.fromEntries(STATUSES.map((s) => {
    const values = forms.map((f) => f.buildup[s])
    return [s, values.includes('immune') ? 'immune' : Math.max(...(values as number[]))]
  })) as Buildup

  const lowest = Math.min(...DAMAGE_TYPES.map((t) => negation[t]))
  const highest = Math.max(...DAMAGE_TYPES.map((t) => negation[t]))
  const weakTo = lowest < 0 ? tiedAt(DAMAGE_TYPES, (t) => negation[t], lowest) : []
  const resists = highest > 0 ? tiedAt(DAMAGE_TYPES, (t) => negation[t], highest) : []

  const immuneTo = STATUSES.filter((s) => buildup[s] === 'immune')
  const procs = STATUSES.filter((s) => buildup[s] !== 'immune')
  const fastestAt = procs.length ? Math.min(...procs.map((s) => buildup[s] as number)) : null
  const fastest = fastestAt === null ? [] : tiedAt(procs, (s) => buildup[s] as number, fastestAt)
  const fastestStandOut = fastest.length * 2 <= procs.length

  return {
    negation,
    buildup,
    weakTo,
    weakBy: weakTo.length ? lowest : null,
    resists,
    fastest,
    fastestAt,
    weakStatuses: fastestStandOut ? fastest : [],
    immuneTo,
    oneForm: weakTo.length ? null : deepestOneFormWeakness(forms),
  }
}

function deepestOneFormWeakness(forms: Form[]): Assessment['oneForm'] {
  if (forms.length < 2) return null
  let best: Assessment['oneForm'] = null
  for (const form of forms) {
    const by = Math.min(...DAMAGE_TYPES.map((t) => form.negation[t]))
    if (by >= 0 || (best && by >= best.by)) continue
    best = { label: form.label, by, weakTo: tiedAt(DAMAGE_TYPES, (t) => form.negation[t], by) }
  }
  return best
}
