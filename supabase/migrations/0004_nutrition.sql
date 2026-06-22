-- WP Recipe Maker parity: nutrition facts + numeric base servings for scaling.
alter table public.recipes
  add column if not exists base_servings int,
  add column if not exists nutrition jsonb;

comment on column public.recipes.base_servings is
  'Numeric serving count the ingredient quantities are written for. Drives the serving scaler.';
comment on column public.recipes.nutrition is
  'Per-serving nutrition facts: {calories, protein, carbs, fat, saturatedFat, fiber, sugar, sodium, source}. Grams except sodium (mg).';
