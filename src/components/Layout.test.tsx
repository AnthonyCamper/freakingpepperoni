import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Layout from './Layout'

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
