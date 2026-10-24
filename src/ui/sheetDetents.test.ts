import { describe, expect, it } from 'vitest'
import { detentHeights, HALF_MAX } from './sheetDetents'

const iPhone15Standalone = { frame: 852, grab: 80, content: 300, safeTop: 59, safeBottom: 34, safeLeft: 0, safeRight: 0, pillBottom: 119 }

describe('sheet detents come from measured elements', () => {
  it('peeks with the grab area plus the home indicator inset', () => {
    expect(detentHeights(iPhone15Standalone).peek).toBe(80 + 34)
    expect(detentHeights({ ...iPhone15Standalone, safeBottom: 0 }).peek).toBe(80)
  })

  it('opens fully flush with the pill, docking below it', () => {
    expect(detentHeights(iPhone15Standalone).full).toBe(852 - 119)
  })

  it('opens fully flush with the safe area when there is no pill', () => {
    expect(detentHeights({ ...iPhone15Standalone, pillBottom: 0 }).full).toBe(852 - 59)
  })

  it('sizes half to the content when it fits', () => {
    expect(detentHeights(iPhone15Standalone).half).toBe(80 + 300 + 34)
  })

  it('caps half at about half the frame for long content', () => {
    expect(detentHeights({ ...iPhone15Standalone, content: 2000 }).half).toBe(Math.round(852 * HALF_MAX))
  })

  it("shows seed 000's whole run card at half in Safari on iPhone 15 (659pt viewport), wrapped Night names included", () => {
    const safari = { ...iPhone15Standalone, frame: 659, safeTop: 0, safeBottom: 0, pillBottom: 68, grab: 108, content: 435 - 108 }
    expect(detentHeights(safari).half).toBe(435)
  })

  it('never sets half below peek or above full', () => {
    const { peek, half } = detentHeights({ ...iPhone15Standalone, content: 0 })
    expect(half).toBe(peek)
    const tiny = detentHeights({ ...iPhone15Standalone, frame: 300, content: 2000 })
    expect(tiny.half).toBeLessThanOrEqual(tiny.full)
    expect(tiny.half).toBeGreaterThanOrEqual(tiny.peek)
  })
})
