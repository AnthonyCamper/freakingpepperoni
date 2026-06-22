import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Layout from './Layout'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ session: null, isEditor: false, loading: false, signIn: vi.fn(), signOut: vi.fn() }),
}))

describe('Layout', () => {
  it('renders the wordmark and footer tagline', () => {
    render(
      <MemoryRouter>
        <Routes><Route element={<Layout />}><Route index element={<p>child</p>} /></Route></Routes>
      </MemoryRouter>,
    )
    expect(screen.getAllByText(/FREAKING PEPPERONI/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/NO COOKIES, JUST PEPPERONI/i)).toBeInTheDocument()
    expect(screen.getByText('child')).toBeInTheDocument()
  })
})
