import { describe, it, expect } from 'vitest'
import { splitIngredients, splitSteps, parseTags } from './parseRecipe'

describe('parseRecipe', () => {
  it('splits ingredient blocks by line, dropping blanks', () => {
    expect(splitIngredients('2 cup butter\n1 1/2 cup sugar\n\n3 cup flour'))
      .toEqual(['2 cup butter', '1 1/2 cup sugar', '3 cup flour'])
  })
  it('splits steps and strips leading numbering', () => {
    expect(splitSteps('1. Cream butter.\n2. Add flour.\n3. Bake.'))
      .toEqual(['Cream butter.', 'Add flour.', 'Bake.'])
  })
  it('keeps unnumbered step lines intact', () => {
    expect(splitSteps('Mix everything.\nBake at 350.'))
      .toEqual(['Mix everything.', 'Bake at 350.'])
  })
  it('parses comma tags into a trimmed array', () => {
    expect(parseTags('cookies, butter cookies, sesame'))
      .toEqual(['cookies', 'butter cookies', 'sesame'])
  })
  it('returns empty arrays for empty input', () => {
    expect(splitIngredients('')).toEqual([])
    expect(splitSteps('')).toEqual([])
    expect(parseTags('')).toEqual([])
  })
})
