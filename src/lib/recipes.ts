import { supabase } from './supabase'
import type { Category, Nutrition, Recipe, RecipeWithExtras } from './types'

export interface GearInput { label: string; url: string; blurb: string }
export interface RecipeInput {
  id?: number; slug: string; name: string; tagline: string; story: string
  ingredients: string[]; steps: string[]; category_id: number | null; photo_url: string | null
  servings: string | null; base_servings: number | null
  prep_time: string | null; cook_time: string | null; total_time: string | null
  notes: string | null; nutrition: Nutrition | null
}

export async function uploadPhoto(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('recipe-photos').upload(path, file, { upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('recipe-photos').getPublicUrl(path)
  return data.publicUrl
}

export async function saveRecipe(input: RecipeInput, gear: GearInput[]): Promise<Recipe> {
  const row = {
    slug: input.slug, name: input.name,
    tagline: input.tagline || null, story: input.story || null,
    ingredients: input.ingredients, steps: input.steps,
    category_id: input.category_id, photo_url: input.photo_url, is_published: true,
    servings: input.servings, base_servings: input.base_servings,
    prep_time: input.prep_time, cook_time: input.cook_time, total_time: input.total_time,
    notes: input.notes, nutrition: input.nutrition,
  }
  const { data, error } = input.id
    ? await supabase.from('recipes').update(row).eq('id', input.id).select().single()
    : await supabase.from('recipes').insert(row).select().single()
  if (error) throw error
  const saved = data as Recipe

  // Replace gear rows
  const { error: delErr } = await supabase.from('recipe_gear').delete().eq('recipe_id', saved.id)
  if (delErr) throw delErr
  const validGear = gear.filter((g) => g.label.trim() && g.url.trim())
  if (validGear.length) {
    const { error: gErr } = await supabase.from('recipe_gear').insert(
      validGear.map((g, i) => ({ recipe_id: saved.id, label: g.label, url: g.url, blurb: g.blurb || null, sort_order: i })),
    )
    if (gErr) throw gErr
  }
  return saved
}

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
