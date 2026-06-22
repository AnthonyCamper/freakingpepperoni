import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RecipeCard from './RecipeCard'
import type { Recipe } from '../lib/types'

const r = { id: 1, slug: 'sunday-gravy', name: 'Sunday Gravy', tagline: 'Better than yours.', ingredients: [], steps: [], tags: [] } as unknown as Recipe

describe('RecipeCard', () => {
  it('renders name, tagline, and links to the recipe', () => {
    render(<MemoryRouter><RecipeCard recipe={r} categoryLabel="PASTA" /></MemoryRouter>)
    expect(screen.getByText('Sunday Gravy')).toBeInTheDocument()
    expect(screen.getByText('Better than yours.')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '#/recipe/sunday-gravy')
  })
})
