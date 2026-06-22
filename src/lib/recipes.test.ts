import { describe, it, expect, vi, beforeEach } from 'vitest'

const { order, eqPub, eqCat: _eqCat, ilike: _ilike, select: _select, from } = vi.hoisted(() => {
  const order = vi.fn()
  const eqPub = vi.fn(() => ({ order }))
  const eqCat = vi.fn(() => ({ eq: eqPub, order }))
  const ilike = vi.fn(() => ({ eq: eqPub, order }))
  const select = vi.fn(() => ({ eq: eqPub, ilike, order, eqCat }))
  const from = vi.fn(() => ({ select }))
  return { order, eqPub, eqCat, ilike, select, from }
})

vi.mock('./supabase', () => ({ supabase: { from } }))

import { listRecipes } from './recipes'

beforeEach(() => { vi.clearAllMocks(); order.mockResolvedValue({ data: [], error: null }) })

describe('listRecipes', () => {
  it('queries the recipes table and filters to published', async () => {
    await listRecipes()
    expect(from).toHaveBeenCalledWith('recipes')
    expect(eqPub).toHaveBeenCalledWith('is_published', true)
  })
})
