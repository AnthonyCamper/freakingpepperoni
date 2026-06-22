import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const signIn = vi.fn()
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ session: null, isEditor: false, loading: false, signIn, signOut: vi.fn() }) }))

import Login from './Login'

beforeEach(() => vi.clearAllMocks())

describe('Login', () => {
  it('calls signIn with entered credentials', async () => {
    signIn.mockResolvedValue({})
    render(<MemoryRouter><Login /></MemoryRouter>)
    await userEvent.type(screen.getByLabelText(/email/i), 'dad@family.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /let me in/i }))
    expect(signIn).toHaveBeenCalledWith('dad@family.com', 'secret')
  })
})
