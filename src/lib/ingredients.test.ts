import { describe, it, expect } from 'vitest'
import {
  parseIngredient, quantityToNumber, formatQuantity, transformIngredient, parseServings,
} from './ingredients'

describe('quantityToNumber', () => {
  it('reads decimals and integers', () => {
    expect(quantityToNumber('2')).toBe(2)
    expect(quantityToNumber('1.5')).toBe(1.5)
  })
  it('reads ascii and mixed fractions', () => {
    expect(quantityToNumber('1/2')).toBe(0.5)
    expect(quantityToNumber('1 1/2')).toBe(1.5)
  })
  it('reads unicode fractions', () => {
    expect(quantityToNumber('½')).toBe(0.5)
    expect(quantityToNumber('1½')).toBe(1.5)
  })
  it('reads ranges as a midpoint', () => {
    expect(quantityToNumber('2-3')).toBe(2.5)
    expect(quantityToNumber('2 to 4')).toBe(3)
  })
})

describe('parseIngredient', () => {
  it('splits qty, unit and rest', () => {
    const p = parseIngredient('2 cups all-purpose flour')
    expect(p.qty).toBe(2)
    expect(p.unit).toBe('cup')
    expect(p.rest).toBe('all-purpose flour')
  })
  it('handles unitless count items', () => {
    const p = parseIngredient('3 eggs')
    expect(p.qty).toBe(3)
    expect(p.unit).toBeNull()
    expect(p.rest).toBe('eggs')
  })
  it('passes through lines with no quantity', () => {
    const p = parseIngredient('Salt and pepper to taste')
    expect(p.qty).toBeNull()
    expect(p.rest).toBe('Salt and pepper to taste')
  })
  it('normalizes unit aliases', () => {
    expect(parseIngredient('1 tbsp olive oil').unit).toBe('tbsp')
    expect(parseIngredient('1 tablespoon olive oil').unit).toBe('tbsp')
    expect(parseIngredient('500 g flour').unit).toBe('g')
  })
})

describe('formatQuantity', () => {
  it('renders nice fractions', () => {
    expect(formatQuantity(0.5)).toBe('½')
    expect(formatQuantity(1.5)).toBe('1½')
    expect(formatQuantity(0.25)).toBe('¼')
  })
  it('renders whole numbers cleanly', () => {
    expect(formatQuantity(2)).toBe('2')
    expect(formatQuantity(2.99)).toBe('3')
  })
})

describe('transformIngredient: scaling', () => {
  it('doubles a quantity', () => {
    expect(transformIngredient('2 cups flour', 2, 'original')).toBe('4 cups flour')
  })
  it('halves with a fraction result', () => {
    expect(transformIngredient('1 cup sugar', 0.5, 'original')).toBe('½ cup sugar')
  })
  it('scales count items', () => {
    expect(transformIngredient('3 eggs', 2, 'original')).toBe('6 eggs')
  })
  it('scales ranges at both ends', () => {
    expect(transformIngredient('2-3 cloves garlic', 2, 'original')).toBe('4–6 cloves garlic')
  })
  it('leaves unparseable lines alone', () => {
    expect(transformIngredient('Salt to taste', 2, 'original')).toBe('Salt to taste')
  })
})

describe('transformIngredient: conversion', () => {
  it('converts cups to metric', () => {
    // 1 cup flour -> ~237 ml
    const out = transformIngredient('1 cup milk', 1, 'metric')
    expect(out).toMatch(/ml|l\b/)
  })
  it('converts ounces to grams', () => {
    const out = transformIngredient('8 oz cheese', 1, 'metric')
    // 8 oz ~= 227 g
    expect(out).toMatch(/2\d\d g/)
  })
  it('keeps metric when already metric', () => {
    expect(transformIngredient('500 g flour', 1, 'metric')).toBe('500 g flour')
  })
  it('converts grams to us ounces', () => {
    const out = transformIngredient('500 g flour', 1, 'us')
    expect(out).toMatch(/oz|lb/)
  })
})

describe('parseServings', () => {
  it('extracts the first number', () => {
    expect(parseServings('4-6 people')).toBe(4)
    expect(parseServings('Serves 8')).toBe(8)
  })
  it('falls back when empty', () => {
    expect(parseServings(null)).toBe(4)
    expect(parseServings('a crowd', 6)).toBe(6)
  })
})
