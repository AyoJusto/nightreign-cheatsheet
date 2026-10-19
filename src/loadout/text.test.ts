import { describe, expect, it } from 'vitest'
import { normalize } from './text'

describe('normalize', () => {
  it('drops apostrophes rather than splitting the word', () => {
    expect(normalize("Night's Cavalry")).toBe('nights cavalry')
    expect(normalize('Night’s Cavalry')).toBe('nights cavalry')
  })

  it('spells out an ampersand', () => {
    expect(normalize('Tibia Mariner & Those Who Live in Death')).toBe(
      normalize('tibia mariner and those who live in death'),
    )
  })

  it('turns other punctuation into single spaces and trims', () => {
    expect(normalize('  Vigor +1/2/3  ')).toBe('vigor 1 2 3')
    expect(normalize('[Status]')).toBe('status')
  })
})
