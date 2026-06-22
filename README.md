# Freaking Pepperoni

Family recipe site. React SPA on GitHub Pages, Supabase backend (Postgres + Auth + Storage).

## Local development

```bash
npm install
cp .env.example .env.local   # fill in after creating your Supabase project
npm run dev
```

## One-time setup (after you create the Supabase project)

1. **Create the project** at https://supabase.com → grab the Project URL and the
   `anon` public key (Settings → API) and the `service_role` key (keep secret).

2. **Apply the database schema.** Using the Supabase CLI:
   ```bash
   supabase link --project-ref <your-ref>
   supabase db push          # applies supabase/migrations/*.sql
   ```
   (Or paste each file in `supabase/migrations/` into the SQL editor in order.)

3. **Seed the 565 recipes:**
   ```bash
   export VITE_SUPABASE_URL="https://<ref>.supabase.co"
   export SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
   npm run seed
   ```

4. **Create editor logins.** In the Supabase dashboard → Authentication → Users →
   Add user (email + password) for Dad and each trusted editor. Then add each to the
   allowlist (SQL editor):
   ```sql
   insert into public.editors (user_id, name)
   values ('<user-uuid-from-auth>', 'Dad');
   ```

5. **Set the Recipe of the Week** (optional — defaults to newest):
   ```sql
   update public.app_config set recipe_of_week_id =
     (select id from public.recipes where slug = 'uncle-sals-bet-winning-chili') where id = 1;
   ```

6. **Configure GitHub.** Repo → Settings → Secrets and variables → Actions, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   Then Settings → Pages → Source = "GitHub Actions". Push to `main` to deploy.

## Architecture
- `src/` — React SPA (HashRouter for Pages). Talks to Supabase via the anon key + RLS.
- `supabase/migrations/` — schema, RLS, storage bucket.
- `scripts/seed.mjs` — CSV → recipes (service-role, run once).
- Design tokens in `tailwind.config.js`; visual reference in `docs/superpowers/design-reference/`.
