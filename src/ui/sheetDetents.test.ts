import { describe, expect, it } from 'vitest'
import { detentHeights, HALF_MAX } from './sheetDetents'

// iPhone 15 in standalone mode: 852pt tall, 59pt status bar, 34pt home indicator, pill bottom at 119.
const phone = { frame: 852, grab: 80, content: 300, safeTop: 59, safeBottom: 34, safeLeft: 0, safeRight: 0, pillBottom: 119 }

describe('sheet detents come from measured elements', () => {
  it('peeks with the grab area plus the home indicator inset', () => {
    expect(detentHeights(phone).peek).toBe(80 + 34)
    expect(detentHeights({ ...phone, safeBottom: 0 }).peek).toBe(80)
  })

  it('opens fully flush with the pill, docking below it', () => {
    expect(detentHeights(phone).full).toBe(852 - 119)
  })

  it('opens fully flush with the safe area when there is no pill', () => {
    expect(detentHeights({ ...phone, pillBottom: 0 }).full).toBe(852 - 59)
  })

  it('sizes half to the content when it fits', () => {
    expect(detentHeights(phone).half).toBe(80 + 300 + 34)
  })

  it('caps half at about half the frame for long content', () => {
    expect(detentHeights({ ...phone, content: 2000 }).half).toBe(Math.round(852 * HALF_MAX))
  })

  it("shows seed 000's whole run card at half in Safari on iPhone 15 (659pt viewport), wrapped Night names included", () => {
    // Measured in WebKit's iPhone 15 profile: header plus a six-row card whose Night 1 and 2 names wrap needs 435pt.
    const safari = { ...phone, frame: 659, safeTop: 0, safeBottom: 0, pillBottom: 68, grab: 108, content: 435 - 108 }
    expect(detentHeights(safari).half).toBe(435)
  })

  it('never sets half below peek or above full', () => {
    const { peek, half } = detentHeights({ ...phone, content: 0 })
    expect(half).toBe(peek)
    const tiny = detentHeights({ ...phone, frame: 300, content: 2000 })
    expect(tiny.half).toBeLessThanOrEqual(tiny.full)
    expect(tiny.half).toBeGreaterThanOrEqual(tiny.peek)
  })
})
