import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('../lib/recipes', () => ({
  getRecipeBySlug: vi.fn().mockResolvedValue({
    id: 1, slug: 'chili', name: 'Bet-Winning Chili', tagline: 'Just cook it.',
    ingredients: ['2 lbs beef', '1 onion'], steps: ['Brown the meat.', 'Simmer.'],
    story: 'It was 1984.', notes: null, tags: [], category: { id: 3, slug: 'mains', name: 'Mains', sort_order: 3 },
    gear: [{ id: 1, recipe_id: 1, label: 'Cast-iron pot', url: 'https://x', blurb: 'Sal swears by it.', sort_order: 0 }],
  }),
  getRelatedRecipes: vi.fn().mockResolvedValue([]),
}))

import RecipePage from './Recipe'

beforeEach(() => vi.clearAllMocks())

describe('Recipe', () => {
  it('renders ingredients, steps, gear, and story', async () => {
    render(<MemoryRouter initialEntries={['/recipe/chili']}><Routes><Route path="recipe/:slug" element={<RecipePage />} /></Routes></MemoryRouter>)
    expect(await screen.findByText('Bet-Winning Chili')).toBeInTheDocument()
    expect(screen.getByText('2 lbs beef')).toBeInTheDocument()
    expect(screen.getByText('Brown the meat.')).toBeInTheDocument()
    expect(screen.getByText(/Cast-iron pot/)).toBeInTheDocument()
    expect(screen.getByText(/It was 1984/)).toBeInTheDocument()
  })
})
