import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const listRecipes = vi.fn()
vi.mock('../lib/recipes', () => ({
  listRecipes: (...a: unknown[]) => listRecipes(...a),
  listCategories: vi.fn().mockResolvedValue([{ id: 3, slug: 'mains', name: 'Mains', sort_order: 3 }]),
}))

import Browse from './Browse'

beforeEach(() => { vi.clearAllMocks(); listRecipes.mockResolvedValue([{ id: 1, slug: 'gravy', name: 'Sunday Gravy', tagline: 't', tags: [] }]) })

describe('Browse', () => {
  it('passes the ?c= category slug to listRecipes', async () => {
    render(<MemoryRouter initialEntries={['/browse?c=mains']}><Browse /></MemoryRouter>)
    await waitFor(() => expect(listRecipes).toHaveBeenCalledWith(expect.objectContaining({ categorySlug: 'mains' })))
    expect(await screen.findByText('Sunday Gravy')).toBeInTheDocument()
  })
})
