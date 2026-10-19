export interface RepeatGroup<T> { item: T; count: number }

/** Collapses consecutive equal items (by `key`) into one entry with a count, so a list of
 * identical rows (e.g. two field bosses of the same kind, back to back) reads as one row with a
 * count instead of unlabelled duplicates. Non-adjacent repeats stay separate rows. */
export function collapseRepeats<T>(items: readonly T[], key: (item: T) => string): RepeatGroup<T>[] {
  const groups: RepeatGroup<T>[] = []
  for (const item of items) {
    const last = groups[groups.length - 1]
    if (last && key(last.item) === key(item)) last.count++
    else groups.push({ item, count: 1 })
  }
  return groups
}
