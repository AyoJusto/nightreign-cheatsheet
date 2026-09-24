import { useState } from 'react'
import { splitStructure, structureName, type ElementId, type StructureKey } from '../domain/names'

/** The game's own emblem for an element: a small square picture, told apart by its shape, not only its colour. */
export function ElementEmblem({ element, className = 'element-emblem', size }: { element: ElementId; className?: string; size?: number }) {
  return <img className={className} src={`/elements/${element}.webp`} alt="" width={size} height={size} draggable={false} aria-hidden />
}

/** The emblem badge's size on art `size` px wide: under half, near the game's own ratio (about 0.4). */
export const emblemSize = (size: number) => Math.round(size * 0.45)

/**
 * The kind's plain art, with the element's emblem as a badge in the corner (where the game puts it), so every
 * kind and element pair reads the same way. Kind art that fails to load falls back to a text glyph.
 */
export function StructureIcon({ structure, size = 36 }: { structure: StructureKey | null; size?: number }) {
  // Remembered per structure, so a reused icon starts fresh when its structure changes.
  const [failed, setFailed] = useState<StructureKey | null>(null)
  if (!structure) return <span className="icon-empty" style={{ width: size, height: size }} aria-hidden />
  const { kind, element } = splitStructure(structure)
  return (
    <span className="structure-icon" style={{ width: size, height: size }} title={structureName(structure)}>
      {failed === structure ? (
        <span className="icon-glyph" aria-hidden>{kind.split('-').map((w) => w[0]).join('').toUpperCase()}</span>
      ) : (
        <img key={kind} className="structure-art" src={`/structures/${kind}.webp`} alt="" width={size} height={size} onError={() => setFailed(structure)} draggable={false} />
      )}
      {element && <ElementEmblem element={element} className="element-badge" size={emblemSize(size)} />}
    </span>
  )
}
