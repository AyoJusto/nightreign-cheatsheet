import { useState } from 'react'
import { BADGE } from './mapGeometry'
import { ELEMENT_CODES, splitStructure, structureName, type ElementId, type StructureKey } from '../domain/names'

/** Falls back to the element's two-letter code if the emblem fails to load. */
export function ElementEmblem({ element, className = 'element-emblem', size }: { element: ElementId; className?: string; size?: number }) {
  const [failedElement, setFailedElement] = useState<ElementId | null>(null)
  if (failedElement === element) {
    return <span className={`${className} element-code`} style={{ minWidth: size, height: size }} aria-hidden>{ELEMENT_CODES[element]}</span>
  }
  return <img key={element} className={className} src={`elements/${element}.webp`} alt="" width={size} height={size}
    onError={() => setFailedElement(element)} draggable={false} aria-hidden />
}

const badgeAt = {
  left: `${(0.5 + BADGE.x - BADGE.size / 2) * 100}%`,
  top: `${(0.5 + BADGE.y - BADGE.size / 2) * 100}%`,
}

/** Falls back to a text glyph if the kind's art fails to load. */
export function StructureIcon({ structure, size = 36 }: { structure: StructureKey | null; size?: number }) {
  const [failedStructure, setFailedStructure] = useState<StructureKey | null>(null)
  if (!structure) return <span className="icon-empty" style={{ width: size, height: size }} aria-hidden />
  const { kind, element } = splitStructure(structure)
  return (
    <span className="structure-icon" style={{ width: size, height: size }} title={structureName(structure)}>
      {failedStructure === structure ? (
        <span className="icon-glyph" aria-hidden>{kind.split('-').map((w) => w[0]).join('').toUpperCase()}</span>
      ) : (
        <img key={kind} className="structure-art" src={`structures/${kind}.webp`} alt="" width={size} height={size} onError={() => setFailedStructure(structure)} draggable={false} />
      )}
      {element && <span className="element-badge-at" style={badgeAt}><ElementEmblem element={element} className="element-badge" size={Math.round(size * BADGE.size)} /></span>}
    </span>
  )
}
