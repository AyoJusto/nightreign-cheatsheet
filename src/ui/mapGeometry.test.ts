import { describe, expect, it } from 'vitest'
import { nearestPin, rubberband } from './mapGeometry'
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
