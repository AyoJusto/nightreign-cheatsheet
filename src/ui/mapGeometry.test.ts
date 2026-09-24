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
})
