import { describe, it, expect } from 'vitest'
import { slugify } from './slug'

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify("Uncle Sal's Bet-Winning Chili")).toBe('uncle-sals-bet-winning-chili')
  })
  it('collapses punctuation and spaces', () => {
    expect(slugify('4AM   Marinara!! (best)')).toBe('4am-marinara-best')
  })
})
