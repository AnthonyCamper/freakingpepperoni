-- Categories (fixed set)
create table public.categories (
  id          bigint generated always as identity primary key,
  slug        text not null unique,
  name        text not null,
  sort_order  int  not null default 0
);

-- Recipes
create table public.recipes (
  id            bigint generated always as identity primary key,
  slug          text not null unique,
  name          text not null,
  tagline       text,
  summary       text,
  servings      text,
  servings_unit text,
  prep_time     text,
  cook_time     text,
  total_time    text,
  ingredients   text[] not null default '{}',
  steps         text[] not null default '{}',
  story         text,
  notes         text,
  tags          text[] not null default '{}',
  category_id   bigint references public.categories(id),
  photo_url     text,
  is_published  boolean not null default true,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index recipes_category_idx on public.recipes(category_id);
create index recipes_published_idx on public.recipes(is_published);

-- Per-recipe affiliate gear ("Recommended Gear")
create table public.recipe_gear (
  id         bigint generated always as identity primary key,
  recipe_id  bigint not null references public.recipes(id) on delete cascade,
  label      text not null,
  url        text not null,
  blurb      text,
  sort_order int not null default 0
);
create index recipe_gear_recipe_idx on public.recipe_gear(recipe_id);

-- Single-row site config (Recipe of the Week)
create table public.app_config (
  id                  int primary key default 1,
  recipe_of_week_id   bigint references public.recipes(id),
  constraint app_config_singleton check (id = 1)
);
insert into public.app_config (id) values (1);

-- Editor allowlist (membership grants write access)
create table public.editors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name    text
);

-- keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
create trigger recipes_touch before update on public.recipes
  for each row execute function public.touch_updated_at();

-- Seed the fixed categories
insert into public.categories (slug, name, sort_order) values
  ('appetizers-snacks',  'Appetizers & Snacks', 1),
  ('soups-stews',        'Soups & Stews',       2),
  ('mains',              'Mains',               3),
  ('pasta-italian',      'Pasta & Italian',     4),
  ('sides',              'Sides',               5),
  ('breads',             'Breads',              6),
  ('desserts',           'Desserts',            7),
  ('cookies-candy',      'Cookies & Candy',     8),
  ('sauces-condiments',  'Sauces & Condiments', 9),
  ('everything-else',    'Everything Else',     10);
