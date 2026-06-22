-- Helper: is the current user a trusted editor?
create or replace function public.is_editor() returns boolean as $$
  select exists (select 1 from public.editors e where e.user_id = auth.uid());
$$ language sql stable security definer;

alter table public.categories  enable row level security;
alter table public.recipes      enable row level security;
alter table public.recipe_gear  enable row level security;
alter table public.app_config   enable row level security;
alter table public.editors      enable row level security;

-- Categories: world-readable, no public writes
create policy categories_read on public.categories for select using (true);

-- Recipes: anon sees published; editors see all and can write
create policy recipes_read_published on public.recipes
  for select using (is_published or public.is_editor());
create policy recipes_insert on public.recipes
  for insert with check (public.is_editor());
create policy recipes_update on public.recipes
  for update using (public.is_editor()) with check (public.is_editor());
create policy recipes_delete on public.recipes
  for delete using (public.is_editor());

-- Gear: world-readable, editor-writable
create policy gear_read on public.recipe_gear for select using (true);
create policy gear_write on public.recipe_gear
  for all using (public.is_editor()) with check (public.is_editor());

-- App config: world-readable, editor-writable
create policy config_read on public.app_config for select using (true);
create policy config_write on public.app_config
  for all using (public.is_editor()) with check (public.is_editor());

-- Editors: a logged-in user may read the allowlist (to know if they're an editor);
-- membership is managed by an admin via the Supabase dashboard / service role.
create policy editors_read on public.editors
  for select using (auth.uid() = user_id or public.is_editor());
