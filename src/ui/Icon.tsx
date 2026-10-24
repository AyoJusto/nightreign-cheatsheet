const PATHS = {
  back: 'M15 5l-7 7 7 7',
  undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  reset: 'M3 12a9 9 0 1 0 2.64-6.36L3 8.3M3 3v5.3h5.3',
  share: 'M12 3v12M8 7l4-4 4 4M7 11H5v10h14V11h-2',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  close: 'M7 7l10 10M17 7 7 17',
  chevron: 'M9 5l7 7-7 7',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5 20 20',
  moon: 'M12 3a7 7 0 1 0 7 9 5.5 5.5 0 0 1-7-9z',
  swords: 'M4 20L20 4M14 4h6v6M4 14l6 6M7 17l-3 3',
  relic: 'M12 3l7 5-2.5 9h-9L5 8z',
  weapon: 'M14.5 4.5l5 5L9 20H4v-5z',
  builds: 'M4 7h16M4 12h16M4 17h10',
} as const

export type IconName = keyof typeof PATHS

/** Decorative: the control around it carries the accessible name. */
export function Icon({ name, size = 22, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={PATHS[name]} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
