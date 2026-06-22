export interface Category { id: number; slug: string; name: string; sort_order: number }
export interface Gear { id: number; recipe_id: number; label: string; url: string; blurb: string | null; sort_order: number }

// Per-serving nutrition facts. Grams except sodium (mg).
export interface Nutrition {
  calories: number; protein: number; carbs: number; fat: number
  saturatedFat?: number; fiber?: number; sugar?: number; sodium?: number
  source: 'manual' | 'estimated'
}

export interface Recipe {
  id: number; slug: string; name: string; tagline: string | null; summary: string | null
  servings: string | null; servings_unit: string | null
  prep_time: string | null; cook_time: string | null; total_time: string | null
  ingredients: string[]; steps: string[]; story: string | null; notes: string | null
  tags: string[]; category_id: number | null; photo_url: string | null
  base_servings: number | null; nutrition: Nutrition | null
  is_published: boolean; created_by: string | null; created_at: string; updated_at: string
}
export interface RecipeWithExtras extends Recipe { category: Category | null; gear: Gear[] }
