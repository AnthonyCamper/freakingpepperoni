import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const saveRecipe = vi.fn()
vi.mock('../lib/recipes', () => ({
  listCategories: vi.fn().mockResolvedValue([{ id: 3, slug: 'mains', name: 'Mains', sort_order: 3 }]),
  getRecipeBySlug: vi.fn(),
  uploadPhoto: vi.fn(),
  saveRecipe: (...a: unknown[]) => saveRecipe(...a),
}))
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ session: {}, isEditor: true, loading: false }) }))

import EditRecipe from './EditRecipe'

beforeEach(() => vi.clearAllMocks())

describe('EditRecipe', () => {
  it('saves a new recipe with title and one ingredient/step', async () => {
    saveRecipe.mockResolvedValue({ slug: 'sunday-gravy' })
    render(<MemoryRouter><EditRecipe /></MemoryRouter>)
    await screen.findByText(/ADD TO THE ARCHIVE/i)
    await userEvent.type(screen.getByPlaceholderText(/Uncle Sal's Sunday Gravy/i), 'Sunday Gravy')
    await userEvent.type(screen.getAllByPlaceholderText(/2 cups flour|1 tsp salt/i)[0], '2 cups flour')
    await userEvent.type(screen.getByPlaceholderText(/Describe the first step/i), 'Simmer all day.')
    await userEvent.click(screen.getByRole('button', { name: /SAVE TO THE ARCHIVE/i }))
    await waitFor(() => expect(saveRecipe).toHaveBeenCalled())
    const [input] = saveRecipe.mock.calls[0]
    expect(input.name).toBe('Sunday Gravy')
    expect(input.slug).toBe('sunday-gravy')
    expect(input.ingredients).toContain('2 cups flour')
    expect(input.steps).toContain('Simmer all day.')
  })
})
