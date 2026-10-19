import { splitStructure, type StructureKey } from '../domain/names'

export interface KindGroup { kind: string; variants: StructureKey[] }

/** Sorted by key, so kinds keep their place between sightings and `ruins` leads `ruins:bleed`. */
export function groupByKind(keys: readonly StructureKey[]): KindGroup[] {
  const groups = new Map<string, StructureKey[]>()
  for (const key of [...keys].sort()) {
    const { kind } = splitStructure(key)
    if (!groups.has(kind)) groups.set(kind, [])
    groups.get(kind)!.push(key)
  }
  return [...groups].map(([kind, variants]) => ({ kind, variants }))
}
