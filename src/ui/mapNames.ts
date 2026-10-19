/** `wrap` is present only when two lines are narrower; `font` and `digit` only for a night's name. */
export interface NameBox { w: number; h: number; wrap?: { w: number; h: number }; font?: number; digit?: { w: number; h: number } }

/** Shrinks a wrapping name to its longest line, not its max-width, and keeps both widths on the element for Tag. */
export function measureName(el: HTMLElement): NameBox {
  el.style.width = ''
  el.style.whiteSpace = ''
  delete el.dataset.numberOnly
  // The name may be scaled with the map mid-gesture.
  const scale = el.getBoundingClientRect().width / (el.offsetWidth || 1) || 1
  const w = textWidth(el, scale)
  if (w > 0 && w < el.offsetWidth) el.style.width = `${w}px`
  const box = { w: el.offsetWidth, h: el.offsetHeight }
  const base = el.style.width
  const two = narrowestTwoLineBox(el, scale)
  el.style.width = base
  el.style.whiteSpace = ''
  const wrap = two && two.w < box.w ? two : undefined
  el.dataset.w = base
  el.dataset.wrap = wrap ? `${wrap.w}px` : base
  const number = el.querySelector<HTMLElement>('.night-1, .night-2')
  const nightName = number ? { font: parseFloat(getComputedStyle(el).fontSize), digit: { w: number.offsetWidth, h: box.h } } : {}
  return { ...box, ...(wrap && { wrap }), ...nightName }
}

function textWidth(el: HTMLElement, scale: number): number {
  const range = document.createRange()
  range.selectNodeContents(el)
  return Math.ceil(range.getBoundingClientRect().width / scale)
}

const LINE_ROUNDING_PX = 1

function narrowestTwoLineBox(el: HTMLElement, scale: number): { w: number; h: number } | undefined {
  el.style.whiteSpace = 'nowrap'
  el.style.width = ''
  const one = { w: el.offsetWidth, h: el.offsetHeight }
  el.style.whiteSpace = 'normal'
  const fitsOnTwoLines = (width: number) => {
    el.style.width = `${width}px`
    return el.offsetHeight <= 2 * one.h + LINE_ROUNDING_PX
  }
  let lo = Math.ceil(one.w / 2)
  let hi = one.w
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (fitsOnTwoLines(mid)) hi = mid
    else lo = mid + 1
  }
  fitsOnTwoLines(hi)
  if (el.offsetHeight <= one.h + LINE_ROUNDING_PX) return undefined
  return { w: Math.min(hi, textWidth(el, scale)), h: el.offsetHeight }
}
