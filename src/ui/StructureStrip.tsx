import { useCallback, useEffect, useRef, type ReactNode, type Ref } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { StructureIcon, ELEMENT_COLORS } from './StructureIcon'
import { Glass } from './Glass'
import type { KindGroup } from './structureGroups'
import { ELEMENT_NAMES, kindName, splitStructure, structureName, type StructureKey } from '../domain/names'

const appear = { initial: { opacity: 0 }, animate: { opacity: 1 } }

/** One button per kind. A kind with several variants expands in place into one chip per element, named. */
export function StructureButtons({ groups, open, focus, onKind, onVariant, onName }: {
  groups: KindGroup[]; open: string | null; focus: StructureKey | null
  onKind: (kind: string) => void; onVariant: (structure: StructureKey) => void
  /** Desktop: the name of the art-only tile under the mouse or keyboard focus, or null when it leaves. */
  onName?: (name: string | null) => void
}) {
  const naming = (name: string) => onName && {
    onPointerEnter: () => onName(name), onPointerLeave: () => onName(null), onFocus: () => onName(name), onBlur: () => onName(null),
  }
  return groups.flatMap(({ kind, variants }) => {
    if (variants.length === 1) {
      const [only] = variants
      const { element } = splitStructure(only)
      // An elemental kind with one variant names its element, like the expanded chips do.
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
    return [
      <motion.button key={kind} layout className="strip-item" data-kind={kind} {...naming(kindName(kind))} aria-label={`${kindName(kind)}, ${variants.length} types`}
        aria-expanded={expanded} onClick={() => onKind(kind)}>
        <StructureIcon structure={kind} size={44} />
        {/* Stacked dots in its elements' colours say "comes in elements"; a number read as a count or an order. */}
        <span className="variant-dots" aria-hidden>
          {variants.flatMap((v) => splitStructure(v).element ?? []).slice(0, 3).map((element) => (
            <span key={element} style={{ background: ELEMENT_COLORS[element] }} />
          ))}
        </span>
      </motion.button>,
      ...(expanded ? variants.map((v) => {
        const { element } = splitStructure(v)
        return (
          <motion.button key={v} layout {...appear} className="strip-variant" aria-label={`Find ${structureName(v)}`}
            aria-pressed={focus === v} onClick={() => onVariant(v)}>
            <StructureIcon structure={v} size={36} />
            <span>{element ? ELEMENT_NAMES[element] : 'No element'}</span>
          </motion.button>
        )
      }) : []),
    ]
  })
}

/** The phone's bottom strip: a glass capsule whose row scrolls, with edge fades wherever more is hidden. */
export function StructureStrip({ glassRef, open, hidden, children }: {
  glassRef: Ref<HTMLDivElement>; open: string | null; hidden: boolean; children: ReactNode
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  // Fades only on the sides that have more to scroll to, so a row that fits shows none.
  const fade = useCallback(() => {
    const el = scroller.current
    if (!el) return
    el.toggleAttribute('data-more-left', el.scrollLeft > 1)
    el.toggleAttribute('data-more-right', el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])
  useEffect(() => {
    const el = scroller.current!
    const observer = new ResizeObserver(fade)
    observer.observe(el)
    return () => observer.disconnect()
  }, [fade])
  useEffect(fade)
  // An expanded kind's chips open to its right, possibly off-screen: bring the kind near the start,
  // clear of the left fade, with a sliver of its neighbour still showing there is more.
  useEffect(() => {
    const el = scroller.current
    const item = open ? el?.querySelector<HTMLElement>(`[data-kind="${open}"]`) : null
    if (el && item) el.scrollTo({ left: item.offsetLeft - 32, behavior: reduce ? 'auto' : 'smooth' })
  }, [open, reduce])
  return (
    <Glass className={`strip${hidden ? ' hidden' : ''}`} ref={glassRef} role="toolbar" aria-label="Structures still possible">
      <div ref={scroller} className="strip-scroll" onScroll={fade}>{children}</div>
    </Glass>
  )
}
