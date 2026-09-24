import { describe, expect, it } from 'vitest'
import { nearestPin, rubberband, placeLabel } from './mapGeometry'
import { catalog } from '../data/catalog'

// Great Hollow slots 9 and 18 sit 32 units apart, so their 44px hit areas overlap at default zoom.
const gh = catalog.slotsOf('great-hollow')
const pins = [{ slot: '9', ...gh['9'] }, { slot: '18', ...gh['18'] }]

describe('a tap snaps to the nearest slot', () => {
  it('picks the slot closest to the touch point, whichever pin is on top', () => {
    const nearEighteen = { x: gh['18'].x, y: gh['18'].y + 12 } // between the two, closer to 18
    expect(nearestPin(pins, nearEighteen, 30)?.slot).toBe('18')
    expect(nearestPin([...pins].reverse(), nearEighteen, 30)?.slot).toBe('18')
    const nearNine = { x: gh['9'].x, y: gh['9'].y - 12 }
    expect(nearestPin(pins, nearNine, 30)?.slot).toBe('9')
  })

  it('reaches a slot up to the radius away and no further', () => {
    const one = [pins[0]]
    expect(nearestPin(one, { x: gh['9'].x + 30, y: gh['9'].y }, 30)?.slot).toBe('9')
    expect(nearestPin(one, { x: gh['9'].x + 31, y: gh['9'].y }, 30)).toBeNull()
  })

  it('lets the pins the current step asks for win over a nearer other pin within reach', () => {
    const isEighteen = (p: { slot: string }) => p.slot === '18'
    const nearNine = { x: gh['9'].x, y: gh['9'].y - 5 } // 5 from slot 9, 27 from slot 18
    expect(nearestPin(pins, nearNine, 30, isEighteen)?.slot).toBe('18')
    // Out of the preferred pin's reach, the nearest other pin still answers.
    const belowNine = { x: gh['9'].x, y: gh['9'].y + 10 } // 42 from slot 18
    expect(nearestPin(pins, belowNine, 30, isEighteen)?.slot).toBe('9')
  })

  it('finds nothing when no pin can be tapped', () => {
    expect(nearestPin([], { x: 500, y: 500 }, 30)).toBeNull()
  })
})

describe('panning past the edge', () => {
  it('follows the finger inside the bounds', () => {
    expect(rubberband(-40, -100, 100, 400)).toBe(-40)
  })
  it('resists more the further it is pulled, on both sides', () => {
    const first = rubberband(150, -100, 100, 400) - 100 // the first 50px past the edge
    const next = rubberband(200, -100, 100, 400) - 100 - first // the next 50px
    expect(first).toBeGreaterThan(0)
    expect(first).toBeLessThan(50)
    expect(next).toBeLessThan(first)
    expect(rubberband(-150, -100, 100, 400)).toBe(-rubberband(150, -100, 100, 400))
  })
})

describe('placeLabel', () => {
  const frame = { w: 400, h: 600 }
  const label = { w: 100, h: 30 }

  it('hangs the label below the point when nothing is there', () => {
    expect(placeLabel({ x: 200, y: 300 }, label, frame, [], 9, 8)).toEqual({ x: 150, y: 309, clear: true })
  })

  it('moves the label to a side that covers no pin', () => {
    const pinBelow = { x0: 195, y0: 310, x1: 205, y1: 330 }
    const pinAbove = { x0: 195, y0: 270, x1: 205, y1: 290 }
    expect(placeLabel({ x: 200, y: 300 }, label, frame, [pinBelow], 9, 8)).toEqual({ x: 150, y: 261, clear: true })
    expect(placeLabel({ x: 200, y: 300 }, label, frame, [pinBelow, pinAbove], 9, 8)).toEqual({ x: 209, y: 285, clear: true })
  })

  it('says when no spot is clear, and takes the one covering least', () => {
    const everywhere = { x0: 0, y0: 0, x1: 400, y1: 600 }
    const nearly = { x0: 150, y0: 309, x1: 160, y1: 339 }
    expect(placeLabel({ x: 200, y: 300 }, label, frame, [everywhere, nearly], 9, 8)).toMatchObject({ clear: false })
  })

  it('keeps the label inside the frame', () => {
    expect(placeLabel({ x: 10, y: 300 }, label, frame, [], 9, 8)).toEqual({ x: 8, y: 309, clear: true })
  })

  // The point's own glyph (a 6px radius here) must stay visible: it is what the marker exists to show.
  const coversPoint = (s: { x: number; y: number }, p: { x: number; y: number }) =>
    s.x < p.x + 6 && s.x + label.w > p.x - 6 && s.y < p.y + 6 && s.y + label.h > p.y - 6

  it('never lets the clamp into the frame push a label back over its own point', () => {
    // Near the left edge, with pins below, above and right, only "left" is clear before clamping,
    // and clamping pulls it right over the point. Some spot that leaves the point visible must win.
    const point = { x: 20, y: 300 }
    const below = { x0: 0, y0: 309, x1: 120, y1: 345 }
    const above = { x0: 0, y0: 255, x1: 120, y1: 291 }
    const right = { x0: 29, y0: 280, x1: 140, y1: 320 }
    const spot = placeLabel(point, label, frame, [below, above, right], 9, 8, 6)
    expect(coversPoint(spot, point)).toBe(false)
    expect(spot.clear).toBe(false)
  })

  it('treats its own point as covered even with no pins around', () => {
    // In a frame barely wider than the label, "below" is still fine; the point is never under it.
    const point = { x: 60, y: 300 }
    const spot = placeLabel(point, label, { w: 116, h: 600 }, [], 9, 8, 6)
    expect(coversPoint(spot, point)).toBe(false)
    expect(spot).toEqual({ x: 8, y: 309, clear: true })
  })

  it('keeps the label inside a frame that stops above the bottom sheet', () => {
    // A point just above a 200px-tall visible frame: "below" would cross its bottom edge, so the label goes above.
    const point = { x: 200, y: 185 }
    const spot = placeLabel(point, label, { w: 400, h: 200 }, [], 9, 8, 6)
    expect(spot.y + label.h).toBeLessThanOrEqual(200 - 8)
    expect(coversPoint(spot, point)).toBe(false)
  })

  it('in a corner, still finds a spot clear of the point', () => {
    const point = { x: 4, y: 4 }
    const spot = placeLabel(point, label, frame, [], 9, 8, 6)
    expect(coversPoint(spot, point)).toBe(false)
  })
})
