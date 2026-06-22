import { describe, it, expect } from 'vitest'
import { cleanIngredientName, gramsForMatch, aggregateFromMatches, type FoodMatch } from './nutrition'
import { parseIngredient } from './ingredients'

const food = (over: Partial<FoodMatch> = {}): FoodMatch => ({
  query: 'x', food_name: 'X', kcal: 100, protein: 10, carbs: 20, fat: 5,
  sat_fat: 1, fiber: 2, sugar: 3, sodium: 50, density_g_per_cup: null, grams_per_unit: null, score: 1,
  ...over,
})

describe('cleanIngredientName', () => {
  it('drops adjectives and prep clauses', () => {
    expect(cleanIngredientName('all-purpose flour, sifted')).toBe('all-purpose flour')
    expect(cleanIngredientName('large eggs')).toBe('eggs')
    expect(cleanIngredientName('finely chopped fresh onion')).toBe('onion')
  })
  it('drops parentheticals and stray punctuation', () => {
    expect(cleanIngredientName('butter (room temperature)')).toBe('butter')
  })
})

describe('gramsForMatch', () => {
  it('handles mass units directly', () => {
    expect(gramsForMatch(parseIngredient('8 oz cheese'), food())).toBeCloseTo(226.8, 0)
    expect(gramsForMatch(parseIngredient('500 g flour'), food())).toBe(500)
  })
  it('uses density for volume units', () => {
    // 1 cup at 125 g/cup -> 125 g
    expect(gramsForMatch(parseIngredient('1 cup flour'), food({ density_g_per_cup: 125 }))).toBeCloseTo(125, 0)
  })
  it('assumes water density when unknown', () => {
    // 1 cup ~ 236 ml ~ 236 g
    expect(gramsForMatch(parseIngredient('1 cup water'), food())).toBeCloseTo(236.6, 0)
  })
  it('uses per-unit weight for count items', () => {
    expect(gramsForMatch(parseIngredient('3 eggs'), food({ grams_per_unit: 50 }))).toBe(150)
  })
  it('returns null for unsizable count items', () => {
    expect(gramsForMatch(parseIngredient('2 onions'), food({ grams_per_unit: null }))).toBeNull()
  })
})

describe('aggregateFromMatches', () => {
  const map = new Map<string, FoodMatch>([
    ['flour', food({ food_name: 'Flour', kcal: 364, density_g_per_cup: 125 })],
    ['sugar', food({ food_name: 'Sugar', kcal: 387, density_g_per_cup: 200 })],
  ])

  it('sums matched foods and divides by servings', () => {
    // 1 cup flour (125g -> 455 kcal) + 1 cup sugar (200g -> 774 kcal) = 1229, /4 = 307
    const r = aggregateFromMatches(['1 cup flour', '1 cup sugar'], map, 4)
    expect(r.matched).toBe(2)
    expect(r.perServing.calories).toBeGreaterThan(290)
    expect(r.perServing.calories).toBeLessThan(320)
  })

  it('reports unmatched lines', () => {
    const r = aggregateFromMatches(['1 cup flour', '1 pinch of unobtanium'], map, 1)
    expect(r.matched).toBe(1)
    expect(r.unmatched).toContain('1 pinch of unobtanium')
  })

  it('records what each line resolved to', () => {
    const r = aggregateFromMatches(['2 cups flour'], map, 1)
    expect(r.matches[0]).toEqual({ line: '2 cups flour', food: 'Flour' })
  })
})
