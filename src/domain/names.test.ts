import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ELEMENT_NAMES } from './names'

describe('element emblems', () => {
  it('ship for every element the app knows, since badges show the emblem, not a colour or code', () => {
    for (const element of Object.keys(ELEMENT_NAMES)) expect(existsSync(`public/elements/${element}.webp`), element).toBe(true)
  })
})
