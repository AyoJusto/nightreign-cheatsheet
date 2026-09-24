import { useMemo } from 'react'
import type { MotionValue } from 'motion/react'
import { MapView, type Pin } from './MapView'
import { catalog } from '../data/catalog'
import { structureName } from '../domain/names'
import type { Seed } from '../domain/seed'

// Minimal stand-in so the finder can land somewhere; Task 10 replaces it with the real result screen.
export function ResultOverlay({ seed, bottomInset }: {
  seed: Seed; go: (path: string, replace?: boolean) => void; bottomInset: MotionValue<number>
}) {
  const pins = useMemo(() => {
    const coords = catalog.slotsOf(seed.earth)
    const out: Pin[] = [{ slot: seed.spawn, ...coords[seed.spawn], state: 'spawn', structure: null, label: `Spawn, slot ${seed.spawn}` }]
    for (const [slot, key] of Object.entries(seed.slots)) {
      if (key && slot !== seed.spawn) out.push({ slot, ...coords[slot], state: 'sighted', structure: key, label: `Slot ${slot}, ${structureName(key)}` })
    }
    return out
  }, [seed])
  return (
    <>
      <MapView earth={seed.earth} pins={pins} bottomInset={bottomInset} onPin={() => {}} />
      <h1 className="title result-stub">Seed {seed.id}</h1>
    </>
  )
}
