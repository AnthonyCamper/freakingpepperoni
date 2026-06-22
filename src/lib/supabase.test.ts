import { describe, it, expect } from 'vitest'
import { supabase } from './supabase'

describe('supabase client', () => {
  it('exposes a from() query builder', () => {
    expect(typeof supabase.from).toBe('function')
  })
})
