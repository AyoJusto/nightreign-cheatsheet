export interface RepeatGroup<T> { item: T; count: number }

export function collapseRepeats<T>(items: readonly T[], key: (item: T) => string): RepeatGroup<T>[] {
  const groups: RepeatGroup<T>[] = []
  for (const item of items) {
    const last = groups[groups.length - 1]
    if (last && key(last.item) === key(item)) last.count++
    else groups.push({ item, count: 1 })
  }
  return groups
}
