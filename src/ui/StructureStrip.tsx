import { useCallback, useEffect, useRef, type ReactNode, type Ref } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { StructureIcon, ElementEmblem } from './StructureIcon'
import { Plate } from './Plate'
import type { KindGroup } from './structureGroups'
import { ELEMENT_NAMES, kindName, splitStructure, structureName, type StructureKey } from '../domain/names'

const appear = { initial: { opacity: 0 }, animate: { opacity: 1 } }
const MAX_EMBLEMS = 3
const NEIGHBOUR_SLIVER = 32

export function StructureButtons({ groups, open, focus, onKind, onVariant, onName, variantsBelow }: {
  groups: KindGroup[]; open: string | null; focus: StructureKey | null
  onKind: (kind: string) => void; onVariant: (structure: StructureKey) => void
  onName?: (name: string | null) => void
  variantsBelow?: boolean
}) {
  const naming = (name: string) => onName && {
    onPointerEnter: () => onName(name), onPointerLeave: () => onName(null), onFocus: () => onName(name), onBlur: () => onName(null),
  }
  const variantChips = (variants: StructureKey[]) => variants.map((v) => {
    const { element } = splitStructure(v)
    return (
      <motion.button key={v} layout {...appear} className="strip-variant" aria-label={`Find ${structureName(v)}`}
        aria-pressed={focus === v} onClick={() => onVariant(v)}>
        <StructureIcon structure={v} size={36} />
        <span>{element ? ELEMENT_NAMES[element] : 'No element'}</span>
      </motion.button>
    )
  })
  const expandedGroup = groups.find((g) => g.kind === open && g.variants.length > 1)
  const tiles = groups.flatMap(({ kind, variants }) => {
    if (variants.length === 1) {
      const [only] = variants
      const { element } = splitStructure(only)
      return [
        <motion.button key={kind} layout className={element ? 'strip-variant' : 'strip-item'} data-kind={kind}
          {...naming(structureName(only))} aria-label={`Find ${structureName(only)}`}
          aria-pressed={focus === only} onClick={() => onVariant(only)}>
          <StructureIcon structure={only} size={element ? 36 : 44} />
          {element && <span>{ELEMENT_NAMES[element]}</span>}
        </motion.button>,
      ]
    }
    const expanded = open === kind
    const elements = variants.flatMap((v) => splitStructure(v).element ?? [])
    const typeNames = variants.map((v) => { const { element } = splitStructure(v); return element ? ELEMENT_NAMES[element] : 'no element' })
    const shown = elements.length > MAX_EMBLEMS ? elements.slice(0, 1) : elements
    return [
      <motion.button key={kind} layout className="strip-item" data-kind={kind} {...naming(`${kindName(kind)}: ${typeNames.join(', ')}`)}
        aria-label={`${kindName(kind)}, ${variants.length} types: ${typeNames.join(', ')}`}
        aria-expanded={expanded} onClick={() => onKind(kind)}>
        <StructureIcon structure={kind} size={44} />
        {elements.length > 0 && (
          <span className="element-codes" aria-hidden>
            {shown.map((element) => <ElementEmblem key={element} element={element} size={14} />)}
            {elements.length > shown.length && <span>+{elements.length - shown.length}</span>}
          </span>
        )}
      </motion.button>,
      ...(expanded && !variantsBelow ? variantChips(variants) : []),
    ]
  })
  if (!variantsBelow || !expandedGroup) return tiles
  return [
    ...tiles,
    <div key="variants" className="structure-variants" role="group" aria-label={`${kindName(expandedGroup.kind)} types`}>
      {variantChips(expandedGroup.variants)}
    </div>,
  ]
}

export function StructureStrip({ plateRef, open, hidden, children }: {
  plateRef: Ref<HTMLDivElement>; open: string | null; hidden: boolean; children: ReactNode
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const markHiddenEdges = useCallback(() => {
    const el = scroller.current
    if (!el) return
    el.toggleAttribute('data-more-left', el.scrollLeft > 1)
    el.toggleAttribute('data-more-right', el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])
  useEffect(() => {
    const el = scroller.current!
    const observer = new ResizeObserver(markHiddenEdges)
    observer.observe(el)
    return () => observer.disconnect()
  }, [markHiddenEdges])
  useEffect(markHiddenEdges)
  useEffect(() => {
    const el = scroller.current
    const item = open ? el?.querySelector<HTMLElement>(`[data-kind="${open}"]`) : null
    if (el && item) el.scrollTo({ left: item.offsetLeft - NEIGHBOUR_SLIVER, behavior: reduce ? 'auto' : 'smooth' })
  }, [open, reduce])
  return (
    <Plate className={`strip${hidden ? ' hidden' : ''}`} ref={plateRef} role="toolbar" aria-label="Structures still possible">
      <div ref={scroller} className="strip-scroll" onScroll={markHiddenEdges}>{children}</div>
    </Plate>
  )
}
