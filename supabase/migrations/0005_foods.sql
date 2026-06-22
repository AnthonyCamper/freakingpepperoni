-- Application-grade nutrition: an owned USDA food database with fuzzy matching.
-- Seed data is loaded separately (see scripts/gen-foods-sql.ts), built from the
-- USDA FoodData Central SR Legacy dataset (public domain).
create extension if not exists pg_trgm;

create table if not exists public.foods (
  id                 bigint generated always as identity primary key,
  fdc_id             int unique,                 -- USDA FoodData Central id (null for custom)
  name               text not null,
  category           text,
  kcal               real,                       -- all nutrients per 100 g
  protein            real,
  carbs              real,
  fat                real,
  sat_fat            real,
  fiber              real,
  sugar              real,
  sodium             real,                       -- mg per 100 g
  density_g_per_cup  real,                       -- for volume measures
  grams_per_unit     real,                       -- weight of one "each" (1 egg, 1 medium)
  source             text not null default 'usda',
  created_at         timestamptz not null default now()
);

create index if not exists foods_name_trgm on public.foods using gin (name gin_trgm_ops);

alter table public.foods enable row level security;
drop policy if exists foods_read on public.foods;
create policy foods_read on public.foods for select using (true);
drop policy if exists foods_write on public.foods;
create policy foods_write on public.foods for all
  using (auth.uid() in (select user_id from public.editors))
  with check (auth.uid() in (select user_id from public.editors));

-- Best food match for each ingredient name, ranked by word similarity so a short
-- query ("flour") matches inside a long USDA description ("Wheat flour, white...").
create or replace function public.match_foods(names text[], min_score real default 0.45)
returns table (
  query text, food_id bigint, food_name text,
  kcal real, protein real, carbs real, fat real, sat_fat real,
  fiber real, sugar real, sodium real,
  density_g_per_cup real, grams_per_unit real, score real
)
language sql stable
as $$
  select q.query, f.id, f.name,
         f.kcal, f.protein, f.carbs, f.fat, f.sat_fat,
         f.fiber, f.sugar, f.sodium,
         f.density_g_per_cup, f.grams_per_unit, f.score
  from unnest(names) as q(query)
  cross join lateral (
    select f2.*, word_similarity(q.query, f2.name) as score
    from public.foods f2
    where f2.kcal is not null
    order by word_similarity(q.query, f2.name) desc, length(f2.name) asc
    limit 1
  ) f
  where f.score >= min_score;
$$;

-- Free-text food search for the editor's food picker.
create or replace function public.search_foods(q text, lim int default 15)
returns table (
  id bigint, name text, category text,
  kcal real, protein real, carbs real, fat real, sat_fat real,
  fiber real, sugar real, sodium real,
  density_g_per_cup real, grams_per_unit real
)
language sql stable
as $$
  select id, name, category, kcal, protein, carbs, fat, sat_fat,
         fiber, sugar, sodium, density_g_per_cup, grams_per_unit
  from public.foods
  where name ilike '%'||q||'%' or word_similarity(q, name) >= 0.4
  order by word_similarity(q, name) desc, length(name) asc
  limit lim;
$$;

grant execute on function public.match_foods(text[], real) to anon, authenticated;
grant execute on function public.search_foods(text, int) to anon, authenticated;
