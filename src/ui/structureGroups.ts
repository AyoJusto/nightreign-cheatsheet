import { splitStructure, type StructureKey } from '../domain/names'

export interface KindGroup { kind: string; variants: StructureKey[] }

export function groupByKind(keys: readonly StructureKey[]): KindGroup[] {
  const groups = new Map<string, StructureKey[]>()
  const sorted = [...keys].sort()
  for (const key of sorted) {
    const { kind } = splitStructure(key)
    if (!groups.has(kind)) groups.set(kind, [])
    groups.get(kind)!.push(key)
  }
  return [...groups].map(([kind, variants]) => ({ kind, variants }))
}
