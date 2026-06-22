import { describe, it, expect } from 'vitest'
import { categorySlugForTags } from './categorize'

describe('categorySlugForTags', () => {
  it('maps cookies to cookies-candy', () => {
    expect(categorySlugForTags(['cookies', 'butter cookies'])).toBe('cookies-candy')
  })
  it('maps soup to soups-stews', () => {
    expect(categorySlugForTags(['soup', 'comfort food'])).toBe('soups-stews')
  })
  it('maps pasta/italian to pasta-italian', () => {
    expect(categorySlugForTags(['Italian', 'pasta'])).toBe('pasta-italian')
  })
  it('falls back to everything-else when nothing matches', () => {
    expect(categorySlugForTags(['mystery'])).toBe('everything-else')
  })
})
