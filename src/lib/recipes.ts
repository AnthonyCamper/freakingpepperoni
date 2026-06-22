import { supabase } from './supabase'
import type { Category, Recipe, RecipeWithExtras } from './types'

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function listRecipes(
  opts: { categorySlug?: string; search?: string; limit?: number } = {},
): Promise<Recipe[]> {
  let q = supabase.from('recipes').select('*, category:categories(slug)').eq('is_published', true)
  if (opts.search) q = q.ilike('name', `%${opts.search}%`)
  if (opts.limit) q = q.limit(opts.limit)
  const { data, error } = await q.order('name')
  if (error) throw error
  let rows = (data ?? []) as unknown as (Recipe & { category: { slug: string } | null })[]
  if (opts.categorySlug) rows = rows.filter((r) => r.category?.slug === opts.categorySlug)
  return rows
}

export async function getRecipeBySlug(slug: string): Promise<RecipeWithExtras | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, category:categories(*), gear:recipe_gear(*)')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const r = data as unknown as RecipeWithExtras
  r.gear = (r.gear ?? []).sort((a, b) => a.sort_order - b.sort_order)
  return r
}

export async function getRecipeOfWeek(): Promise<Recipe | null> {
  const { data: cfg } = await supabase.from('app_config').select('recipe_of_week_id').eq('id', 1).maybeSingle()
  if (!cfg?.recipe_of_week_id) {
    // Fallback: newest published recipe so the hero is never empty.
    const { data } = await supabase.from('recipes').select('*').eq('is_published', true).order('created_at', { ascending: false }).limit(1)
    return data?.[0] ?? null
  }
  const { data } = await supabase.from('recipes').select('*').eq('id', cfg.recipe_of_week_id).maybeSingle()
  return data ?? null
}

export async function getRelatedRecipes(recipe: Recipe, limit = 3): Promise<Recipe[]> {
  let q = supabase.from('recipes').select('*').eq('is_published', true).neq('id', recipe.id)
  if (recipe.category_id) q = q.eq('category_id', recipe.category_id)
  const { data, error } = await q.limit(limit)
  if (error) throw error
  return data ?? []
}
