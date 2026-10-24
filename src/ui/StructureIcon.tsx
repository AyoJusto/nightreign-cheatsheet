import { useState } from 'react'
import { BADGE_FRACTION_OF_ART_BOX } from './mapGeometry'
import { ELEMENT_CODES, splitStructure, structureName, type ElementId, type StructureKey } from '../domain/names'

export function ElementEmblem({ element, className = 'element-emblem', size }: { element: ElementId; className?: string; size?: number }) {
  const [failedElement, setFailedElement] = useState<ElementId | null>(null)
  if (failedElement === element) {
    return <span className={`${className} element-code`} style={{ minWidth: size, height: size }} aria-hidden>{ELEMENT_CODES[element]}</span>
  }
  return <img key={element} className={className} src={`elements/${element}.webp`} alt="" width={size} height={size}
    onError={() => setFailedElement(element)} draggable={false} aria-hidden />
}

const badgeAt = {
  left: `${(0.5 + BADGE_FRACTION_OF_ART_BOX.x - BADGE_FRACTION_OF_ART_BOX.size / 2) * 100}%`,
  top: `${(0.5 + BADGE_FRACTION_OF_ART_BOX.y - BADGE_FRACTION_OF_ART_BOX.size / 2) * 100}%`,
}

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
      {element && <span className="element-badge-at" style={badgeAt}><ElementEmblem element={element} className="element-badge" size={Math.round(size * BADGE_FRACTION_OF_ART_BOX.size)} /></span>}
    </span>
  )
}
