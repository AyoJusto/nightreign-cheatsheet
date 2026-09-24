import { describe, expect, it } from 'vitest'
import { detentHeights, HALF_MAX } from './sheetDetents'

// iPhone 15 in standalone mode: 852pt tall, 59pt status bar, 34pt home indicator, pill bottom at 119.
const phone = { frame: 852, grab: 80, content: 300, safeTop: 59, safeBottom: 34, pillBottom: 119 }

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

  it('never sets half below peek or above full', () => {
    const { peek, half } = detentHeights({ ...phone, content: 0 })
    expect(half).toBe(peek)
    const tiny = detentHeights({ ...phone, frame: 300, content: 2000 })
    expect(tiny.half).toBeLessThanOrEqual(tiny.full)
    expect(tiny.half).toBeGreaterThanOrEqual(tiny.peek)
  })
})
