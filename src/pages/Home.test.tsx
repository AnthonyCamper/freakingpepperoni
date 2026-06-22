import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../lib/recipes', () => ({
  getRecipeOfWeek: vi.fn().mockResolvedValue({ id: 1, slug: 'chili', name: 'Bet-Winning Chili', tagline: 'Just cook it.', tags: [] }),
  listRecipes: vi.fn().mockResolvedValue([{ id: 2, slug: 'gravy', name: 'Sunday Gravy', tagline: 'Better than yours.', tags: [] }]),
  listCategories: vi.fn().mockResolvedValue([{ id: 3, slug: 'mains', name: 'Mains', sort_order: 3 }]),
}))

import Home from './Home'

beforeEach(() => vi.clearAllMocks())

describe('Home', () => {
  it('shows the recipe of the week and the grid', async () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    expect(await screen.findByText(/RECIPE OF THE WEEK/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Bet-Winning Chili')).toBeInTheDocument())
    expect(screen.getByText('Sunday Gravy')).toBeInTheDocument()
  })
})
