import { useState } from 'react'
import { BADGE } from './mapGeometry'
import { ELEMENT_CODES, splitStructure, structureName, type ElementId, type StructureKey } from '../domain/names'

/**
 * The game's own emblem for an element: a small square picture, told apart by its shape, not only its colour.
 * If it fails to load, the element's two-letter code stands in, so the element never drops out silently.
 */
export function ElementEmblem({ element, className = 'element-emblem', size }: { element: ElementId; className?: string; size?: number }) {
  // Remembered per element, so a reused emblem tries again when its element changes.
  const [failed, setFailed] = useState<ElementId | null>(null)
  if (failed === element) {
    return <span className={`${className} element-code`} style={{ minWidth: size, height: size }} aria-hidden>{ELEMENT_CODES[element]}</span>
  }
  return <img key={element} className={className} src={`elements/${element}.webp`} alt="" width={size} height={size}
    onError={() => setFailed(element)} draggable={false} aria-hidden />
}

// The badge's box, where the game puts it on the art (BADGE), as percentages so it follows the art's size.
const badgeAt = {
  left: `${(0.5 + BADGE.x - BADGE.size / 2) * 100}%`,
  top: `${(0.5 + BADGE.y - BADGE.size / 2) * 100}%`,
}

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
        <img key={kind} className="structure-art" src={`structures/${kind}.webp`} alt="" width={size} height={size} onError={() => setFailed(structure)} draggable={false} />
      )}
      {element && <span className="element-badge-at" style={badgeAt}><ElementEmblem element={element} className="element-badge" size={Math.round(size * BADGE.size)} /></span>}
    </span>
  )
}
