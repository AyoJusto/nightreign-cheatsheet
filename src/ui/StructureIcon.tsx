import { useState } from 'react'
import { splitStructure, structureName, ELEMENT_NAMES, type StructureKey } from '../domain/names'

const ELEMENT_COLORS: Record<string, string> = {
  fire: '#ff7a45', holy: '#f5d76e', magic: '#6aa9ff', lightning: '#ffd84d', frostbite: '#9fe3ff', poison: '#8fd46b',
  bleed: '#e0455a', blight: '#9b8cff', madness: '#ffb347', sleep: '#c49bff', rot: '#e05a3c',
}

// Fallback chain: variant art (`kind--element`), then kind art, then a text glyph.
// Many kinds only ship kind art, so the badge carries the element either way.
type Stage = 'variant' | 'kind' | 'glyph'

/** Icon plus an element badge, so element never relies on the icon's color alone. */
export function StructureIcon({ structure, size = 36 }: { structure: StructureKey | null; size?: number }) {
  // Failures are remembered per structure so a reused icon starts fresh when its structure changes.
  const [failure, setFailure] = useState<{ structure: StructureKey | null; stage: Stage } | null>(null)
  if (!structure) return <span className="icon-empty" style={{ width: size, height: size }} aria-hidden />
  const { kind, element } = splitStructure(structure)
  const firstStage: Stage = element ? 'variant' : 'kind'
  const stage = failure?.structure === structure ? failure.stage : firstStage
  const src = stage === 'variant' ? `/structures/${kind}--${element}.webp` : `/structures/${kind}.webp`
  const onError = () => setFailure({ structure, stage: stage === 'variant' ? 'kind' : 'glyph' })
  return (
    <span className="structure-icon" style={{ width: size, height: size }} title={structureName(structure)}>
      {stage === 'glyph' ? (
        <span className="icon-glyph" aria-hidden>{kind.split('-').map((w) => w[0]).join('').toUpperCase()}</span>
      ) : (
        <img key={src} src={src} alt="" width={size} height={size} onError={onError} draggable={false} />
      )}
      {element && (
        <span className="element-badge" style={{ background: ELEMENT_COLORS[element] }} aria-hidden>
          {ELEMENT_NAMES[element][0]}
        </span>
      )}
    </span>
  )
}
