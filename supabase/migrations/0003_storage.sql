-- Public bucket for recipe photos
insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', true)
on conflict (id) do nothing;

-- Anyone can read photos
create policy "recipe photos public read" on storage.objects
  for select using (bucket_id = 'recipe-photos');

-- Only editors can upload / modify / delete
create policy "recipe photos editor insert" on storage.objects
  for insert with check (bucket_id = 'recipe-photos' and public.is_editor());
create policy "recipe photos editor update" on storage.objects
  for update using (bucket_id = 'recipe-photos' and public.is_editor());
create policy "recipe photos editor delete" on storage.objects
  for delete using (bucket_id = 'recipe-photos' and public.is_editor());
