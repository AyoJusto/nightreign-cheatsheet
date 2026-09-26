// Measuring a map name's box in the DOM, for MapView's placement pass.

/** A name's box as placed, and `wrap`, its box on two lines as narrow as its words allow, when that is narrower. */
export interface NameBox { w: number; h: number; wrap?: { w: number; h: number }; font?: number; digit?: { w: number; h: number } }

/**
 * A name's size as placed. A name that wraps is as wide as its longest line, not its max-width: the box is shrunk
 * to that line (the same breaks still fit), so its neighbours may come as close as the words themselves. Both
 * widths are kept on the element for Tag, which shows whichever the placement chose.
 */
export function measureName(el: HTMLElement): NameBox {
  el.style.width = ''
  el.style.whiteSpace = ''
  delete el.dataset.numberOnly
  // On screen the name may be scaled with the map mid-gesture: back to its own px.
  const scale = el.getBoundingClientRect().width / (el.offsetWidth || 1) || 1
  const w = textWidth(el, scale)
  if (w > 0 && w < el.offsetWidth) el.style.width = `${w}px`
  const box = { w: el.offsetWidth, h: el.offsetHeight }
  const base = el.style.width
  const two = twoLines(el, scale)
  el.style.width = base
  el.style.whiteSpace = ''
  const wrap = two && two.w < box.w ? two : undefined
  el.dataset.w = base
  el.dataset.wrap = wrap ? `${wrap.w}px` : base
  // A night's name also keeps its font size and its number's box, in case it must shrink inside its ring.
  const number = el.querySelector<HTMLElement>('.ring-1, .ring-2')
  const ring = number ? { font: parseFloat(getComputedStyle(el).fontSize), digit: { w: number.offsetWidth, h: box.h } } : {}
  return { ...box, ...(wrap && { wrap }), ...ring }
}

/** The width of the words themselves, in the name's own px. */
function textWidth(el: HTMLElement, scale: number): number {
  const range = document.createRange()
  range.selectNodeContents(el)
  return Math.ceil(range.getBoundingClientRect().width / scale)
}

/**
 * The name laid out by the browser on two lines as narrow as its words allow, as its box: the narrowest width that
 * still takes no more than two of its lines. Undefined for a single word.
 */
function twoLines(el: HTMLElement, scale: number): { w: number; h: number } | undefined {
  el.style.whiteSpace = 'nowrap'
  el.style.width = ''
  const one = { w: el.offsetWidth, h: el.offsetHeight }
  el.style.whiteSpace = 'normal'
  const fits = (width: number) => {
    el.style.width = `${width}px`
    return el.offsetHeight <= 2 * one.h + 1
  }
  let lo = Math.ceil(one.w / 2)
  let hi = one.w
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (fits(mid)) hi = mid
    else lo = mid + 1
  }
  fits(hi)
  if (el.offsetHeight <= one.h + 1) return undefined
  return { w: Math.min(hi, textWidth(el, scale)), h: el.offsetHeight }
}
