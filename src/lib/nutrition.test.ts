import { describe, it, expect } from 'vitest'
import { estimateNutrition } from './nutrition'

describe('estimateNutrition', () => {
  it('estimates calories from a known ingredient', () => {
    // 100 g flour ~= 364 kcal, over 1 serving
    const r = estimateNutrition(['100 g flour'], 1)
    expect(r.matched).toBe(1)
    expect(r.perServing.calories).toBeGreaterThan(300)
    expect(r.perServing.calories).toBeLessThan(420)
  })

  it('divides totals across servings', () => {
    const one = estimateNutrition(['200 g sugar'], 1).perServing.calories
    const four = estimateNutrition(['200 g sugar'], 4).perServing.calories
    expect(Math.round(one / four)).toBe(4)
  })

  it('converts volume measures using density', () => {
    // 1 cup flour ~= 125 g ~= 455 kcal
    const r = estimateNutrition(['1 cup flour'], 1)
    expect(r.perServing.calories).toBeGreaterThan(400)
    expect(r.perServing.calories).toBeLessThan(520)
  })

  it('handles count items via per-unit weight', () => {
    // 2 eggs ~= 100 g ~= 143 kcal
    const r = estimateNutrition(['2 eggs'], 1)
    expect(r.matched).toBe(1)
    expect(r.perServing.calories).toBeGreaterThan(120)
    expect(r.perServing.calories).toBeLessThan(170)
  })

  it('reports unmatched ingredients', () => {
    const r = estimateNutrition(['1 pinch of unobtanium', '100 g sugar'], 1)
    expect(r.matched).toBe(1)
    expect(r.unmatched).toContain('1 pinch of unobtanium')
  })

  it('prefers the most specific keyword', () => {
    // "brown sugar" should not fall back to plain "sugar" density differences;
    // both match but the specific entry is chosen first.
    const r = estimateNutrition(['1 cup brown sugar'], 1)
    expect(r.matched).toBe(1)
    expect(r.perServing.sugar).toBeGreaterThan(150)
  })
})
