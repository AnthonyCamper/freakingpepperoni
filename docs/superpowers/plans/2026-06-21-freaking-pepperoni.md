# Freaking Pepperoni Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Freaking Pepperoni family-recipe website — a React SPA deployed to GitHub Pages, backed by Supabase (Postgres + Auth + Storage), with all 565 real recipes seeded and a dead-simple editor flow.

**Architecture:** A Vite + React + TypeScript single-page app talks directly to Supabase from the browser via `@supabase/supabase-js` (public anon key). Everyone reads published recipes; only authenticated editors (an allowlist table) can write — enforced by Postgres Row-Level Security. The visual layer is a faithful port of the committed Stitch designs ("Grumpy Uncle Kitchen"). All backend plumbing (SQL migrations, seed script, CI) ships now and is activated by the user once they create their Supabase project.

**Tech Stack:** Vite 5, React 18, TypeScript, Tailwind CSS 3, react-router-dom 6 (HashRouter), @supabase/supabase-js 2, Vitest + @testing-library/react, PapaParse (seed). GitHub Actions → GitHub Pages.

## Global Constraints

- **Visual fidelity is non-negotiable.** The committed reference HTML in `docs/superpowers/design-reference/{home,recipe,add-recipe}.html` is the source of truth for layout, Tailwind classes, type scale, copy tone, and the custom `brutal-*` / `grease-stain-list` / `serrated` / `paper-hr` / `index-card` utility classes. Port markup faithfully.
- **Design tokens** (copied verbatim from the Stitch Tailwind config) live in `tailwind.config.js` exactly as specified in Task 1. Do not invent colors or font sizes.
- **Fonts:** Domine (headlines), Public Sans (body), Courier Prime (labels/mono), Material Symbols Outlined (icons). Loaded via Google Fonts `<link>` in `index.html`.
- **GitHub Pages:** Vite `base: './'` (relative) + **HashRouter** so deep links work without a server. No BrowserRouter.
- **Supabase access from browser:** anon key only, via `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never embed a service-role key in the frontend. The seed script (Node-only) uses the service-role key from a non-`VITE_` env var.
- **Categories (fixed seeded set, `sort_order` in this order):** Appetizers & Snacks, Soups & Stews, Mains, Pasta & Italian, Sides, Breads, Desserts, Cookies & Candy, Sauces & Condiments, Everything Else.
- **Voice:** gruff, funny, insider "grumpy uncle." Keep placeholder/empty-state copy in-character (see reference HTML).
- **Package manager:** npm. Node 20.

---

## File Structure

```
freakingpepperoni/
├── index.html                       # Vite entry; Google Fonts links
├── package.json
├── vite.config.ts
├── tsconfig.json / tsconfig.node.json
├── tailwind.config.js               # design tokens (Task 1)
├── postcss.config.js
├── .env.example
├── .github/workflows/deploy.yml     # build + deploy to Pages (Task 12)
├── recipes.csv                      # existing — seed source
├── src/
│   ├── main.tsx                     # React root + HashRouter
│   ├── App.tsx                      # routes
│   ├── index.css                    # @tailwind + brutal utilities (Task 1)
│   ├── vite-env.d.ts
│   ├── lib/
│   │   ├── supabase.ts              # browser client (Task 1)
│   │   ├── types.ts                 # Recipe/Category/Gear types (Task 4)
│   │   ├── slug.ts                  # slugify (Task 3)
│   │   ├── categorize.ts            # tags → category (Task 3)
│   │   ├── parseRecipe.ts           # CSV block → ingredients/steps (Task 3)
│   │   └── recipes.ts               # data-access functions (Task 4)
│   ├── context/AuthContext.tsx      # session + editor state (Task 10)
│   ├── components/
│   │   ├── Layout.tsx               # TopNav + <Outlet/> + Footer (Task 5)
│   │   ├── TopNav.tsx               # (Task 5)
│   │   ├── Footer.tsx               # (Task 5)
│   │   ├── RecipeCard.tsx           # (Task 6)
│   │   └── ProtectedRoute.tsx       # editor gate (Task 10)
│   └── pages/
│       ├── Home.tsx                 # (Task 7)
│       ├── Browse.tsx               # (Task 8)
│       ├── Recipe.tsx               # (Task 9)
│       ├── Login.tsx                # (Task 10)
│       └── EditRecipe.tsx           # add/edit form (Task 11)
├── supabase/migrations/
│   ├── 0001_schema.sql              # tables (Task 2)
│   ├── 0002_rls.sql                 # policies (Task 2)
│   └── 0003_storage.sql             # photo bucket + policies (Task 2)
├── scripts/seed.mjs                 # CSV → Supabase (Task 3)
└── README.md                        # post-creation runbook (Task 12)
```

---

## Task 1: Project scaffold, design tokens, Supabase client

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `postcss.config.js`, `tailwind.config.js`, `index.html`, `.env.example`, `.gitignore`
- Create: `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`, `src/lib/supabase.ts`
- Test: `src/lib/supabase.test.ts`

**Interfaces:**
- Produces: `supabase` (a `SupabaseClient` from `src/lib/supabase.ts`); the Tailwind token set; `App` component rendering routes.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "freaking-pepperoni",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "seed": "node scripts/seed.mjs"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "jsdom": "^24.1.1",
    "papaparse": "^5.4.1",
    "postcss": "^8.4.40",
    "tailwindcss": "^3.4.7",
    "typescript": "^5.5.4",
    "vite": "^5.3.5",
    "vitest": "^2.0.5"
  }
}
```

Run: `npm install`
Expected: `node_modules/` populated, no peer errors.

- [ ] **Step 2: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
  },
})
```

- [ ] **Step 3: Create `src/test-setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 4: Create `tsconfig.json` and `tsconfig.node.json`**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Create `postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: Create `tailwind.config.js` with the verbatim Stitch tokens**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'error-container': '#ffdad6', 'surface-dim': '#dbdad6', 'outline': '#8e706d',
        'background': '#faf9f5', 'outline-variant': '#e2beba', 'on-secondary-container': '#656464',
        'on-tertiary': '#ffffff', 'surface-container-highest': '#e3e2df', 'tertiary-container': '#904917',
        'surface-bright': '#faf9f5', 'on-primary': '#ffffff', 'surface-variant': '#e3e2df',
        'primary-container': '#b22222', 'tertiary': '#723200', 'surface-container-lowest': '#ffffff',
        'surface-container': '#efeeea', 'on-surface-variant': '#5a403e', 'secondary-fixed': '#e4e2e1',
        'inverse-surface': '#2f312e', 'surface': '#faf9f5', 'secondary-container': '#e4e2e1',
        'on-background': '#1b1c1a', 'on-error': '#ffffff', 'tertiary-fixed': '#ffdbc9',
        'on-primary-fixed': '#410003', 'on-primary-container': '#ffc8c2', 'primary-fixed': '#ffdad6',
        'inverse-primary': '#ffb4ac', 'surface-tint': '#b52424', 'on-surface': '#1b1c1a',
        'on-primary-fixed-variant': '#92030f', 'inverse-on-surface': '#f2f1ed', 'primary-fixed-dim': '#ffb4ac',
        'on-tertiary-fixed-variant': '#753401', 'on-secondary-fixed-variant': '#474747', 'secondary': '#5f5e5e',
        'surface-container-high': '#e9e8e4', 'on-tertiary-fixed': '#321200', 'on-secondary': '#ffffff',
        'on-error-container': '#93000a', 'tertiary-fixed-dim': '#ffb68c', 'on-tertiary-container': '#ffcaad',
        'on-secondary-fixed': '#1b1c1c', 'error': '#ba1a1a', 'secondary-fixed-dim': '#c8c6c6',
        'primary': '#8f000d', 'surface-container-low': '#f4f4f0',
      },
      borderRadius: { DEFAULT: '0.25rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' },
      spacing: {
        'margin-mobile': '16px', 'unit': '4px', 'stack-md': '16px', 'margin-desktop': '64px',
        'gutter': '24px', 'stack-sm': '8px', 'stack-lg': '32px',
      },
      fontFamily: {
        'display-lg': ['Domine'], 'body-sm': ['Public Sans'], 'label-mono': ['Courier Prime'],
        'body-md': ['Public Sans'], 'body-lg': ['Public Sans'], 'display-lg-mobile': ['Domine'],
        'headline-sm': ['Domine'], 'headline-md': ['Domine'], 'label-caps': ['Courier Prime'],
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '52px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'body-sm': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-mono': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-md': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-lg': ['20px', { lineHeight: '32px', fontWeight: '400' }],
        'display-lg-mobile': ['36px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-sm': ['24px', { lineHeight: '28px', fontWeight: '600' }],
        'headline-md': ['32px', { lineHeight: '36px', fontWeight: '700' }],
        'label-caps': ['14px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '700' }],
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 7: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Freaking Pepperoni</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Domine:wght@400;600;700&family=Public+Sans:wght@400;500;700&family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create `src/index.css` with Tailwind + ported custom utilities**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-background text-on-background font-body-md antialiased;
}
.material-symbols-outlined { font-family: 'Material Symbols Outlined'; font-weight: normal; font-style: normal; line-height: 1; }

/* Brutalist utilities ported from the Stitch reference */
.brutal-shadow { box-shadow: 4px 4px 0 0 #1b1c1a; }
.brutal-border { border: 2px solid #1b1c1a; }
.brutal-border-heavy { border: 4px solid #1b1c1a; }
.brutal-border-b { border-bottom: 2px solid #1b1c1a; }
.brutalist-offset { box-shadow: 6px 6px 0 0 #1b1c1a; }
.brutal-btn, .brutalist-btn-offset { transition: transform .1s, box-shadow .1s; }
.brutal-btn:hover, .brutalist-btn-offset:hover { transform: translate(-2px, -2px); box-shadow: 4px 4px 0 0 #1b1c1a; }
.brutal-btn:active, .brutalist-btn-offset:active { transform: translate(2px, 2px); box-shadow: 0 0 0 0 #1b1c1a; }
.brutal-input { border-bottom: 3px solid #1b1c1a; }
.brutal-input:focus { border-color: #b22222; }
.brutal-border-bottom { border-bottom: 3px solid #1b1c1a; }

.grease-stain-list { border-left: 3px solid #b22222; padding-left: 1rem; }

hr.serrated {
  border: none; height: 4px;
  background-image:
    linear-gradient(-45deg, transparent 33.33%, #1b1c1a 33.33%, #1b1c1a 66.66%, transparent 66.66%),
    linear-gradient(45deg, transparent 33.33%, #1b1c1a 33.33%, #1b1c1a 66.66%, transparent 66.66%);
  background-size: 8px 16px; background-position: 0 100%;
}
.paper-hr { border: none; border-top: 1px solid #1b1c1a; margin: 32px 0; position: relative; }
.index-card { background-color: #ffffff; border: 1px solid #1b1c1a; }
```

- [ ] **Step 9: Create `src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}
interface ImportMeta { readonly env: ImportMetaEnv }
```

- [ ] **Step 10: Create `.env.example` and `.gitignore`**

`.env.example`:
```
# Copy to .env.local and fill in after creating your Supabase project.
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

# Node-only — used by `npm run seed`. NEVER commit a real value.
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`.gitignore`:
```
node_modules
dist
.env
.env.local
*.local
.DS_Store
```

- [ ] **Step 11: Write the failing test `src/lib/supabase.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { supabase } from './supabase'

describe('supabase client', () => {
  it('exposes a from() query builder', () => {
    expect(typeof supabase.from).toBe('function')
  })
})
```

- [ ] **Step 12: Run test to verify it fails**

Run: `npx vitest run src/lib/supabase.test.ts`
Expected: FAIL — cannot resolve `./supabase`.

- [ ] **Step 13: Create `src/lib/supabase.ts`**

```ts
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Surfaced loudly in dev; the app still loads so the design is visible.
  console.warn('Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
}

export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'anon')
```

- [ ] **Step 14: Create minimal `src/App.tsx` and `src/main.tsx`**

`src/App.tsx`:
```tsx
export default function App() {
  return (
    <div className="max-w-[1200px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <h1 className="font-display-lg text-display-lg uppercase text-primary">Freaking Pepperoni</h1>
      <p className="font-label-mono text-label-mono mt-4">Scaffold online. Plumbing in progress.</p>
    </div>
  )
}
```

`src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 15: Run test to verify it passes**

Run: `npx vitest run src/lib/supabase.test.ts`
Expected: PASS.

- [ ] **Step 16: Verify the app builds and renders**

Run: `npm run build` → Expected: succeeds, emits `dist/`.
Run: `npm run dev` then open the printed URL → Expected: tomato-red "Freaking Pepperoni" headline in Domine on flour-white background.

- [ ] **Step 17: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite+React+TS app with Grumpy Uncle Kitchen design tokens"
```

---

## Task 2: Supabase schema, RLS, and storage migrations

**Files:**
- Create: `supabase/migrations/0001_schema.sql`, `supabase/migrations/0002_rls.sql`, `supabase/migrations/0003_storage.sql`

**Interfaces:**
- Produces: tables `categories(id,slug,name,sort_order)`, `recipes(...)`, `recipe_gear(...)`, `app_config(...)`, `editors(user_id,name)`; a public `recipe-photos` storage bucket. Consumed by Tasks 3, 4, 9, 11.

- [ ] **Step 1: Create `supabase/migrations/0001_schema.sql`**

```sql
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
```

- [ ] **Step 2: Create `supabase/migrations/0002_rls.sql`**

```sql
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
```

- [ ] **Step 3: Create `supabase/migrations/0003_storage.sql`**

```sql
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
```

- [ ] **Step 4: Verify SQL applies cleanly (local Supabase if available)**

If the Supabase CLI + Docker are available:
Run: `supabase init` (once) then `supabase start && supabase db reset`
Expected: all three migrations apply with no errors; `categories` has 10 rows.

If the CLI is **not** available (no project yet): visually verify each statement is valid Postgres and that table/policy/function names match those referenced in Tasks 3–11 (`recipes`, `recipe_gear`, `app_config`, `editors`, `categories`, `is_editor()`, bucket `recipe-photos`). This SQL is applied for real during the README runbook.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations
git commit -m "feat: Supabase schema, RLS policies, and photo storage bucket"
```

---

## Task 3: Seed helpers + seed script (CSV → Supabase)

**Files:**
- Create: `src/lib/slug.ts`, `src/lib/categorize.ts`, `src/lib/parseRecipe.ts`
- Create: `scripts/seed.mjs`
- Test: `src/lib/slug.test.ts`, `src/lib/categorize.test.ts`, `src/lib/parseRecipe.test.ts`

**Interfaces:**
- Produces:
  - `slugify(name: string): string`
  - `categorySlugForTags(tags: string[]): string` — returns one of the 10 category slugs.
  - `splitIngredients(block: string): string[]` and `splitSteps(block: string): string[]`
  - `parseTags(raw: string): string[]`
- Consumed by `scripts/seed.mjs` and Task 11.

- [ ] **Step 1: Write failing test `src/lib/slug.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { slugify } from './slug'

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify("Uncle Sal's Bet-Winning Chili")).toBe('uncle-sals-bet-winning-chili')
  })
  it('collapses punctuation and spaces', () => {
    expect(slugify('4AM   Marinara!! (best)')).toBe('4am-marinara-best')
  })
})
```

- [ ] **Step 2: Run it — Expected: FAIL (no module).** `npx vitest run src/lib/slug.test.ts`

- [ ] **Step 3: Implement `src/lib/slug.ts`**

```ts
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

- [ ] **Step 4: Run it — Expected: PASS.**

- [ ] **Step 5: Write failing test `src/lib/categorize.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { categorySlugForTags } from './categorize'

describe('categorySlugForTags', () => {
  it('maps cookies to cookies-candy', () => {
    expect(categorySlugForTags(['cookies', 'butter cookies'])).toBe('cookies-candy')
  })
  it('maps soup to soups-stews', () => {
    expect(categorySlugForTags(['soup', 'comfort food'])).toBe('soups-stews')
  })
  it('maps pasta/italian to pasta-italian', () => {
    expect(categorySlugForTags(['Italian', 'pasta'])).toBe('pasta-italian')
  })
  it('falls back to everything-else when nothing matches', () => {
    expect(categorySlugForTags(['mystery'])).toBe('everything-else')
  })
})
```

- [ ] **Step 6: Run it — Expected: FAIL.**

- [ ] **Step 7: Implement `src/lib/categorize.ts`**

Mapping rules are keyword → category slug, checked in priority order (first match wins). Desserts/cookies are checked before generic terms so "chocolate cake" lands in desserts.

```ts
const RULES: Array<[RegExp, string]> = [
  [/cookie|candy|fudge|brittle|truffle|bonbon|confection|bar$/i, 'cookies-candy'],
  [/cake|pie|dessert|pastry|tart|pudding|custard|ice cream|frosting|sweet/i, 'desserts'],
  [/soup|stew|chowder|chili|broth|bisque/i, 'soups-stews'],
  [/pasta|spaghetti|lasagna|ravioli|gnocchi|risotto|italian|marinara/i, 'pasta-italian'],
  [/bread|roll|biscuit|muffin|loaf|focaccia|bun|bagel|scone/i, 'breads'],
  [/sauce|dressing|condiment|marinade|rub|jam|jelly|pickle|relish|gravy/i, 'sauces-condiments'],
  [/appetizer|dip|snack|finger food|hors|starter/i, 'appetizers-snacks'],
  [/side dish|side$|salad|vegetable|potato|rice/i, 'sides'],
  [/chicken|beef|pork|fish|seafood|casserole|main|dinner|entree|roast|meatball|lamb|turkey/i, 'mains'],
]

export function categorySlugForTags(tags: string[]): string {
  const hay = tags.join(' | ').toLowerCase()
  for (const [re, slug] of RULES) {
    if (re.test(hay)) return slug
  }
  return 'everything-else'
}
```

- [ ] **Step 8: Run it — Expected: PASS.**

- [ ] **Step 9: Write failing test `src/lib/parseRecipe.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { splitIngredients, splitSteps, parseTags } from './parseRecipe'

describe('parseRecipe', () => {
  it('splits ingredient blocks by line, dropping blanks', () => {
    expect(splitIngredients('2 cup butter\n1 1/2 cup sugar\n\n3 cup flour'))
      .toEqual(['2 cup butter', '1 1/2 cup sugar', '3 cup flour'])
  })
  it('splits steps and strips leading numbering', () => {
    expect(splitSteps('1. Cream butter.\n2. Add flour.\n3. Bake.'))
      .toEqual(['Cream butter.', 'Add flour.', 'Bake.'])
  })
  it('keeps unnumbered step lines intact', () => {
    expect(splitSteps('Mix everything.\nBake at 350.'))
      .toEqual(['Mix everything.', 'Bake at 350.'])
  })
  it('parses comma tags into a trimmed array', () => {
    expect(parseTags('cookies, butter cookies, sesame'))
      .toEqual(['cookies', 'butter cookies', 'sesame'])
  })
  it('returns empty arrays for empty input', () => {
    expect(splitIngredients('')).toEqual([])
    expect(splitSteps('')).toEqual([])
    expect(parseTags('')).toEqual([])
  })
})
```

- [ ] **Step 10: Run it — Expected: FAIL.**

- [ ] **Step 11: Implement `src/lib/parseRecipe.ts`**

```ts
export function splitIngredients(block: string): string[] {
  return (block ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
}

export function splitSteps(block: string): string[] {
  return (block ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^\d+[.)]\s*/, ''))
    .filter(Boolean)
}

export function parseTags(raw: string): string[] {
  return (raw ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}
```

- [ ] **Step 12: Run it — Expected: PASS.**

- [ ] **Step 13: Create `scripts/seed.mjs`**

Reads `recipes.csv`, builds rows, upserts categories→ids, inserts recipes in batches. Uses the **service-role** key (bypasses RLS) so it must run server-side only.

```js
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import Papa from 'papaparse'
import { slugify } from '../src/lib/slug.ts'
import { categorySlugForTags } from '../src/lib/categorize.ts'
import { splitIngredients, splitSteps, parseTags } from '../src/lib/parseRecipe.ts'

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.')
  process.exit(1)
}
const db = createClient(url, serviceKey, { auth: { persistSession: false } })

const csv = readFileSync(new URL('../recipes.csv', import.meta.url), 'utf8')
const { data: rows } = Papa.parse(csv, { header: true, skipEmptyLines: true })

// Map category slug -> id
const { data: cats, error: catErr } = await db.from('categories').select('id, slug')
if (catErr) { console.error(catErr); process.exit(1) }
const catId = Object.fromEntries(cats.map((c) => [c.slug, c.id]))

// Dedupe slugs (CSV may have repeats)
const seen = new Set()
const records = rows.map((r) => {
  let slug = slugify(r.name || 'untitled')
  let s = slug, n = 2
  while (seen.has(s)) { s = `${slug}-${n++}` }
  seen.add(s)
  const tags = parseTags(r.tags)
  return {
    slug: s,
    name: r.name?.trim() || 'Untitled',
    tagline: null,
    summary: r.summary?.trim() || null,
    servings: r.servings?.trim() || null,
    servings_unit: r.servings_unit?.trim() || null,
    prep_time: r.prep_time?.trim() || null,
    cook_time: r.cook_time?.trim() || null,
    total_time: r.total_time?.trim() || null,
    ingredients: splitIngredients(r.ingredient_blocks),
    steps: splitSteps(r.instruction_blocks),
    story: null,
    notes: r.notes?.trim() || null,
    tags,
    category_id: catId[categorySlugForTags(tags)] ?? catId['everything-else'],
    photo_url: null,
    is_published: true,
  }
})

console.log(`Seeding ${records.length} recipes...`)
const BATCH = 200
for (let i = 0; i < records.length; i += BATCH) {
  const chunk = records.slice(i, i + BATCH)
  const { error } = await db.from('recipes').upsert(chunk, { onConflict: 'slug' })
  if (error) { console.error('Batch failed:', error); process.exit(1) }
  console.log(`  ${Math.min(i + BATCH, records.length)}/${records.length}`)
}
console.log('Done.')
```

> Note: `seed.mjs` imports `.ts` helpers. Run it with Node's TS support via `node --experimental-strip-types scripts/seed.mjs` (Node 22+) OR change the `seed` script to `npx tsx scripts/seed.mjs` and add `tsx` to devDependencies. Use whichever the runbook documents (Task 12 uses `npx tsx`).

- [ ] **Step 14: Add `tsx` to devDependencies and fix the `seed` script**

In `package.json`, add `"tsx": "^4.16.0"` to `devDependencies` and set `"seed": "tsx scripts/seed.mjs"`. Run `npm install`.

- [ ] **Step 15: Dry-run the parsing offline (no DB needed)**

Run: `npx vitest run src/lib`
Expected: all slug/categorize/parseRecipe tests PASS. (Live seeding happens in the README runbook once the project exists.)

- [ ] **Step 16: Commit**

```bash
git add src/lib/slug.ts src/lib/categorize.ts src/lib/parseRecipe.ts src/lib/*.test.ts scripts/seed.mjs package.json package-lock.json
git commit -m "feat: CSV seed script and parsing helpers (slug, category mapping, blocks)"
```

---

## Task 4: Types and data-access layer

**Files:**
- Create: `src/lib/types.ts`, `src/lib/recipes.ts`
- Test: `src/lib/recipes.test.ts`

**Interfaces:**
- Produces (`types.ts`):
  ```ts
  export interface Category { id: number; slug: string; name: string; sort_order: number }
  export interface Gear { id: number; recipe_id: number; label: string; url: string; blurb: string | null; sort_order: number }
  export interface Recipe {
    id: number; slug: string; name: string; tagline: string | null; summary: string | null
    servings: string | null; servings_unit: string | null
    prep_time: string | null; cook_time: string | null; total_time: string | null
    ingredients: string[]; steps: string[]; story: string | null; notes: string | null
    tags: string[]; category_id: number | null; photo_url: string | null
    is_published: boolean; created_by: string | null; created_at: string; updated_at: string
  }
  export interface RecipeWithExtras extends Recipe { category: Category | null; gear: Gear[] }
  ```
- Produces (`recipes.ts`):
  - `listCategories(): Promise<Category[]>`
  - `listRecipes(opts?: { categorySlug?: string; search?: string; limit?: number }): Promise<Recipe[]>`
  - `getRecipeBySlug(slug: string): Promise<RecipeWithExtras | null>`
  - `getRecipeOfWeek(): Promise<Recipe | null>`
  - `getRelatedRecipes(recipe: Recipe, limit?: number): Promise<Recipe[]>`
  - `saveRecipe(input: RecipeInput, gear: GearInput[]): Promise<Recipe>` (defined in Task 11)
- Consumed by Tasks 7, 8, 9, 11.

- [ ] **Step 1: Create `src/lib/types.ts`** with the interfaces shown above.

- [ ] **Step 2: Write failing test `src/lib/recipes.test.ts`**

Mock the supabase module so the query chain is asserted without a network.

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const order = vi.fn()
const eqPub = vi.fn(() => ({ order }))
const eqCat = vi.fn(() => ({ eq: eqPub, order }))
const ilike = vi.fn(() => ({ eq: eqPub, order }))
const select = vi.fn(() => ({ eq: eqPub, ilike, order, eqCat }))
const from = vi.fn(() => ({ select }))

vi.mock('./supabase', () => ({ supabase: { from } }))

import { listRecipes } from './recipes'

beforeEach(() => { vi.clearAllMocks(); order.mockResolvedValue({ data: [], error: null }) })

describe('listRecipes', () => {
  it('queries the recipes table and filters to published', async () => {
    await listRecipes()
    expect(from).toHaveBeenCalledWith('recipes')
    expect(eqPub).toHaveBeenCalledWith('is_published', true)
  })
})
```

- [ ] **Step 3: Run it — Expected: FAIL.** `npx vitest run src/lib/recipes.test.ts`

- [ ] **Step 4: Implement `src/lib/recipes.ts`**

```ts
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
```

- [ ] **Step 5: Run it — Expected: PASS.**

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/recipes.ts src/lib/recipes.test.ts
git commit -m "feat: typed Supabase data-access layer for recipes/categories"
```

---

## Task 5: Layout — TopNav, Footer, Layout shell

**Files:**
- Create: `src/components/TopNav.tsx`, `src/components/Footer.tsx`, `src/components/Layout.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`
- Test: `src/components/Layout.test.tsx`

**Interfaces:**
- Consumes: `useAuth()` is NOT yet available (Task 10). For now `TopNav` shows a static "LOGIN" link to `#/login`. Task 10 swaps in real auth state.
- Produces: `<Layout>` wrapping routed pages via `<Outlet/>`; routes wired in `App.tsx`.

> Visual source: `docs/superpowers/design-reference/home.html` lines 139–162 (header) and 262–275 (footer). Categories in the nav are the real category names; keep "ARCHIVE" pointing at Browse.

- [ ] **Step 1: Write failing test `src/components/Layout.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Layout from './Layout'

describe('Layout', () => {
  it('renders the wordmark and footer tagline', () => {
    render(
      <MemoryRouter>
        <Routes><Route element={<Layout />}><Route index element={<p>child</p>} /></Route></Routes>
      </MemoryRouter>,
    )
    expect(screen.getAllByText(/FREAKING PEPPERONI/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/NO COOKIES, JUST PEPPERONI/i)).toBeInTheDocument()
    expect(screen.getByText('child')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it — Expected: FAIL.**

- [ ] **Step 3: Implement `src/components/TopNav.tsx`**

```tsx
import { Link, NavLink } from 'react-router-dom'

const navItem = 'font-headline-sm text-headline-sm uppercase text-on-surface hover:text-primary hover:bg-surface-container transition-colors px-2 py-1'

export default function TopNav() {
  return (
    <header className="w-full bg-surface border-b-2 border-on-background sticky top-0 z-50">
      <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-[1200px] mx-auto">
        <Link to="/" className="font-display-lg-mobile text-display-lg-mobile font-black text-primary tracking-tighter uppercase whitespace-nowrap">
          FREAKING PEPPERONI
        </Link>
        <nav className="hidden md:flex items-center gap-gutter">
          <NavLink to="/browse" className={navItem}>ARCHIVE</NavLink>
          <NavLink to="/browse?c=mains" className={navItem}>MAINS</NavLink>
          <NavLink to="/browse?c=pasta-italian" className={navItem}>PASTA</NavLink>
          <NavLink to="/browse?c=desserts" className={navItem}>DESSERTS</NavLink>
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/browse" className="brutal-btn bg-surface border-2 border-on-background p-2 transition-all group" aria-label="Search">
            <span className="material-symbols-outlined text-on-background group-hover:text-primary">search</span>
          </Link>
          <Link to="/login" className="brutal-btn hidden md:inline-block bg-primary-container text-on-primary-container border-2 border-on-background px-6 py-2 font-label-caps text-label-caps uppercase transition-all">
            LOGIN
          </Link>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Implement `src/components/Footer.tsx`**

```tsx
export default function Footer() {
  return (
    <footer className="w-full bg-on-background border-t-4 border-primary mt-16">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-stack-lg gap-gutter max-w-[1200px] mx-auto">
        <div className="font-headline-sm text-headline-sm text-surface uppercase">FREAKING PEPPERONI</div>
        <nav className="flex flex-wrap justify-center gap-4">
          <span className="font-label-mono text-label-mono text-surface-variant opacity-80 uppercase">ASK YOUR AUNTIE</span>
          <span className="font-label-mono text-label-mono text-surface-variant opacity-80 uppercase">TERMS OF THE KITCHEN</span>
        </nav>
        <div className="font-label-mono text-label-mono text-surface-variant opacity-60 text-center md:text-right max-w-[300px]">
          HAND-CODED BY THE FAMILY. NO COOKIES, JUST PEPPERONI.
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 5: Implement `src/components/Layout.tsx`**

```tsx
import { Outlet } from 'react-router-dom'
import TopNav from './TopNav'
import Footer from './Footer'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-grow w-full max-w-[1200px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 6: Replace `src/App.tsx` with the router and stub pages**

```tsx
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'

function Stub({ title }: { title: string }) {
  return <h1 className="font-display-lg text-display-lg uppercase">{title}</h1>
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Stub title="Home" />} />
        <Route path="browse" element={<Stub title="Browse" />} />
        <Route path="recipe/:slug" element={<Stub title="Recipe" />} />
        <Route path="login" element={<Stub title="Login" />} />
        <Route path="add" element={<Stub title="Add Recipe" />} />
        <Route path="edit/:slug" element={<Stub title="Edit Recipe" />} />
        <Route path="*" element={<Stub title="404 — Nothing Here" />} />
      </Route>
    </Routes>
  )
}
```

- [ ] **Step 7: Wrap the app in `HashRouter` in `src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)
```

- [ ] **Step 8: Run test — Expected: PASS.** `npx vitest run src/components/Layout.test.tsx`

- [ ] **Step 9: Visual check** — `npm run dev`, confirm sticky red wordmark header + dark footer match `design-reference/home.html`.

- [ ] **Step 10: Commit**

```bash
git add src/components/TopNav.tsx src/components/Footer.tsx src/components/Layout.tsx src/components/Layout.test.tsx src/App.tsx src/main.tsx
git commit -m "feat: app shell — TopNav, Footer, HashRouter routes"
```

---

## Task 6: RecipeCard component

**Files:**
- Create: `src/components/RecipeCard.tsx`
- Test: `src/components/RecipeCard.test.tsx`

**Interfaces:**
- Consumes: `Recipe` (Task 4), a `categoryLabel?: string` prop for the corner tab.
- Produces: `<RecipeCard recipe={r} categoryLabel="MAINS" />` linking to `/recipe/:slug`.

> Visual source: `design-reference/home.html` lines 212–226 (grid card).

- [ ] **Step 1: Write failing test `src/components/RecipeCard.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RecipeCard from './RecipeCard'
import type { Recipe } from '../lib/types'

const r = { id: 1, slug: 'sunday-gravy', name: 'Sunday Gravy', tagline: 'Better than yours.', ingredients: [], steps: [], tags: [] } as unknown as Recipe

describe('RecipeCard', () => {
  it('renders name, tagline, and links to the recipe', () => {
    render(<MemoryRouter><RecipeCard recipe={r} categoryLabel="PASTA" /></MemoryRouter>)
    expect(screen.getByText('Sunday Gravy')).toBeInTheDocument()
    expect(screen.getByText('Better than yours.')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '#/recipe/sunday-gravy')
  })
})
```

- [ ] **Step 2: Run it — Expected: FAIL.**

- [ ] **Step 3: Implement `src/components/RecipeCard.tsx`**

```tsx
import { Link } from 'react-router-dom'
import type { Recipe } from '../lib/types'

const FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#e3e2df"/><text x="50%" y="50%" font-family="Courier" font-size="20" fill="#8e706d" text-anchor="middle">NO PHOTO YET</text></svg>`,
)

export default function RecipeCard({ recipe, categoryLabel }: { recipe: Recipe; categoryLabel?: string }) {
  return (
    <Link to={`/recipe/${recipe.slug}`} className="bg-surface brutal-border flex flex-col relative group hover:-translate-y-1 transition-transform brutal-shadow block">
      {categoryLabel && (
        <div className="absolute top-0 right-4 bg-primary text-on-primary font-label-caps text-[10px] px-2 py-1 brutal-border border-t-0 z-10 uppercase">
          {categoryLabel}
        </div>
      )}
      <div className="h-48 brutal-border-b bg-surface-container-lowest overflow-hidden">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter contrast-125 saturate-[0.85]"
          src={recipe.photo_url || FALLBACK}
          alt={recipe.name}
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-headline-sm text-headline-sm text-on-background uppercase leading-tight mb-2">{recipe.name}</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-4 flex-grow">
          {recipe.tagline || recipe.summary || 'No notes. Just make it.'}
        </p>
        <span className="font-label-mono text-label-mono text-primary flex items-center gap-1 group-hover:underline underline-offset-4 decoration-2">
          READ MORE <span className="material-symbols-outlined text-[16px]">arrow_right_alt</span>
        </span>
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: Run it — Expected: PASS.**

- [ ] **Step 5: Commit**

```bash
git add src/components/RecipeCard.tsx src/components/RecipeCard.test.tsx
git commit -m "feat: RecipeCard with category tab and photo fallback"
```

---

## Task 7: Home page

**Files:**
- Create: `src/pages/Home.tsx`
- Modify: `src/App.tsx` (route `index` → `<Home/>`)
- Test: `src/pages/Home.test.tsx`

**Interfaces:**
- Consumes: `getRecipeOfWeek`, `listRecipes`, `listCategories` (Task 4); `RecipeCard` (Task 6).
- Produces: `<Home/>`.

> Visual source: `design-reference/home.html` lines 163–259 (hero + search/filters + grid).

- [ ] **Step 1: Write failing test `src/pages/Home.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../lib/recipes', () => ({
  getRecipeOfWeek: vi.fn().mockResolvedValue({ id: 1, slug: 'chili', name: 'Bet-Winning Chili', tagline: 'Just cook it.', tags: [] }),
  listRecipes: vi.fn().mockResolvedValue([{ id: 2, slug: 'gravy', name: 'Sunday Gravy', tagline: 'Better than yours.', tags: [] }]),
  listCategories: vi.fn().mockResolvedValue([{ id: 3, slug: 'mains', name: 'Mains', sort_order: 3 }]),
}))

import Home from './Home'

beforeEach(() => vi.clearAllMocks())

describe('Home', () => {
  it('shows the recipe of the week and the grid', async () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    expect(await screen.findByText(/RECIPE OF THE WEEK/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Bet-Winning Chili')).toBeInTheDocument())
    expect(screen.getByText('Sunday Gravy')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it — Expected: FAIL.**

- [ ] **Step 3: Implement `src/pages/Home.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getRecipeOfWeek, listRecipes, listCategories } from '../lib/recipes'
import type { Category, Recipe } from '../lib/types'
import RecipeCard from '../components/RecipeCard'

export default function Home() {
  const [rotw, setRotw] = useState<Recipe | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getRecipeOfWeek().then(setRotw).catch(console.error)
    listRecipes({ limit: 12 }).then(setRecipes).catch(console.error)
    listCategories().then(setCategories).catch(console.error)
  }, [])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate(`/browse?q=${encodeURIComponent(search)}`)
  }

  return (
    <div className="flex flex-col gap-[64px]">
      {/* Recipe of the Week hero */}
      {rotw && (
        <section className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-stretch">
          <div className="md:col-span-7 brutal-border-heavy brutal-shadow relative bg-surface-container-highest min-h-[400px]">
            <div className="absolute -top-4 -left-4 bg-primary-container text-on-primary-container font-label-caps text-label-caps px-4 py-2 brutal-border brutal-shadow z-10 rotate-[-2deg]">
              RECIPE OF THE WEEK
            </div>
            {rotw.photo_url && (
              <img className="w-full h-full object-cover filter contrast-125 grayscale-[10%]" src={rotw.photo_url} alt={rotw.name} />
            )}
          </div>
          <div className="md:col-span-5 flex flex-col justify-center gap-stack-lg pl-0 md:pl-4 mt-8 md:mt-0">
            <div>
              <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-background leading-none uppercase mb-4">{rotw.name}</h1>
              <hr className="border-t-2 border-on-background my-4 w-1/3" />
              <p className="font-body-lg text-body-lg text-on-surface-variant font-medium">{rotw.tagline || rotw.summary || 'No description. Trust the family.'}</p>
            </div>
            <div className="mt-auto">
              <Link to={`/recipe/${rotw.slug}`} className="brutal-btn inline-block bg-primary-container text-on-primary-container brutal-border px-8 py-4 font-label-caps text-label-caps uppercase text-lg text-center transition-all hover:bg-primary text-white">
                GET THE RECIPE
              </Link>
            </div>
          </div>
        </section>
      )}

      <hr className="border-t-4 border-on-background border-dashed" />

      {/* Search + category filters */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md">
        <form onSubmit={submitSearch} className="w-full md:w-1/2">
          <label className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-2 block" htmlFor="search-input">Index Search</label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-0 text-on-surface-variant text-3xl font-bold">arrow_forward</span>
            <input id="search-input" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-0 border-b-4 border-on-background pl-10 py-2 font-headline-sm text-headline-sm text-on-background focus:border-primary placeholder:text-surface-dim transition-colors rounded-none outline-none"
              placeholder="Find what you're looking for..." type="text" />
          </div>
        </form>
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          <span className="font-label-caps text-label-caps self-center mr-2 text-on-surface-variant hidden md:inline">FILTER:</span>
          {categories.slice(0, 4).map((c) => (
            <Link key={c.id} to={`/browse?c=${c.slug}`} className="bg-surface font-label-mono text-label-mono brutal-border px-3 py-1 hover:bg-primary-container hover:text-on-primary-container transition-colors">
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {recipes.map((r) => <RecipeCard key={r.id} recipe={r} />)}
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Wire the route** — in `src/App.tsx` replace `<Route index element={<Stub title="Home" />} />` with `<Route index element={<Home />} />` and add `import Home from './pages/Home'`.

- [ ] **Step 5: Run test — Expected: PASS.** `npx vitest run src/pages/Home.test.tsx`

- [ ] **Step 6: Visual check** against `design-reference/home.html` (hero, dashed rule, search + chips, 3-col grid).

- [ ] **Step 7: Commit**

```bash
git add src/pages/Home.tsx src/pages/Home.test.tsx src/App.tsx
git commit -m "feat: Home page with Recipe of the Week hero, search, category chips, grid"
```

---

## Task 8: Browse page (search + category filter)

**Files:**
- Create: `src/pages/Browse.tsx`
- Modify: `src/App.tsx`
- Test: `src/pages/Browse.test.tsx`

**Interfaces:**
- Consumes: `listRecipes`, `listCategories` (Task 4); `RecipeCard` (Task 6); URL query params `?q=` (search) and `?c=` (category slug).
- Produces: `<Browse/>`.

- [ ] **Step 1: Write failing test `src/pages/Browse.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const listRecipes = vi.fn()
vi.mock('../lib/recipes', () => ({
  listRecipes: (...a: unknown[]) => listRecipes(...a),
  listCategories: vi.fn().mockResolvedValue([{ id: 3, slug: 'mains', name: 'Mains', sort_order: 3 }]),
}))

import Browse from './Browse'

beforeEach(() => { vi.clearAllMocks(); listRecipes.mockResolvedValue([{ id: 1, slug: 'gravy', name: 'Sunday Gravy', tagline: 't', tags: [] }]) })

describe('Browse', () => {
  it('passes the ?c= category slug to listRecipes', async () => {
    render(<MemoryRouter initialEntries={['/browse?c=mains']}><Browse /></MemoryRouter>)
    await waitFor(() => expect(listRecipes).toHaveBeenCalledWith(expect.objectContaining({ categorySlug: 'mains' })))
    expect(await screen.findByText('Sunday Gravy')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it — Expected: FAIL.**

- [ ] **Step 3: Implement `src/pages/Browse.tsx`**

```tsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listRecipes, listCategories } from '../lib/recipes'
import type { Category, Recipe } from '../lib/types'
import RecipeCard from '../components/RecipeCard'

export default function Browse() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const c = params.get('c') ?? ''
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const catById = useMemo(() => Object.fromEntries(categories.map((x) => [x.id, x])), [categories])

  useEffect(() => { listCategories().then(setCategories).catch(console.error) }, [])
  useEffect(() => {
    setLoading(true)
    listRecipes({ search: q || undefined, categorySlug: c || undefined })
      .then(setRecipes).catch(console.error).finally(() => setLoading(false))
  }, [q, c])

  return (
    <div className="flex flex-col gap-stack-lg">
      <header className="border-l-4 border-primary pl-4 py-1">
        <h1 className="font-display-lg text-display-lg uppercase">THE ARCHIVE</h1>
        <p className="font-label-mono text-label-mono text-on-surface-variant mt-2">Everything the family will admit to cooking.</p>
      </header>

      <div className="relative flex items-center">
        <span className="material-symbols-outlined absolute left-0 text-on-surface-variant text-3xl">arrow_forward</span>
        <input value={q} onChange={(e) => setParams((p) => { p.set('q', e.target.value); return p }, { replace: true })}
          className="w-full bg-transparent border-0 border-b-4 border-on-background pl-10 py-2 font-headline-sm text-headline-sm focus:border-primary placeholder:text-surface-dim outline-none rounded-none"
          placeholder="Find what you're looking for..." />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to="/browse" className={`font-label-mono text-label-mono brutal-border px-3 py-1 ${!c ? 'bg-primary-container text-on-primary-container' : 'bg-surface'}`}>ALL</Link>
        {categories.map((cat) => (
          <Link key={cat.id} to={`/browse?c=${cat.slug}`}
            className={`font-label-mono text-label-mono brutal-border px-3 py-1 ${c === cat.slug ? 'bg-primary-container text-on-primary-container' : 'bg-surface hover:bg-primary-container hover:text-on-primary-container'} transition-colors`}>
            {cat.name}
          </Link>
        ))}
      </div>

      {loading ? (
        <p className="font-label-mono text-label-mono text-on-surface-variant">Digging through the box…</p>
      ) : recipes.length === 0 ? (
        <p className="font-headline-sm text-headline-sm uppercase">Nothing here. Try again, hotshot.</p>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {recipes.map((r) => <RecipeCard key={r.id} recipe={r} categoryLabel={r.category_id ? catById[r.category_id]?.name : undefined} />)}
        </section>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Wire the route** — replace the Browse stub with `<Route path="browse" element={<Browse />} />` and import it.

- [ ] **Step 5: Run test — Expected: PASS.**

- [ ] **Step 6: Commit**

```bash
git add src/pages/Browse.tsx src/pages/Browse.test.tsx src/App.tsx
git commit -m "feat: Browse page with URL-driven search and category filters"
```

---

## Task 9: Recipe detail page

**Files:**
- Create: `src/pages/Recipe.tsx`
- Modify: `src/App.tsx`
- Test: `src/pages/Recipe.test.tsx`

**Interfaces:**
- Consumes: `getRecipeBySlug`, `getRelatedRecipes` (Task 4); `RecipeCard` (Task 6); route param `:slug`.
- Produces: `<RecipePage/>`.

> Visual source: `design-reference/recipe.html` lines 182–293 — title/photo column, "Hardware/Execution" two-column canvas (ingredients + steps above the fold), Recommended Gear box, "The Story" section, related grid.

- [ ] **Step 1: Write failing test `src/pages/Recipe.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('../lib/recipes', () => ({
  getRecipeBySlug: vi.fn().mockResolvedValue({
    id: 1, slug: 'chili', name: 'Bet-Winning Chili', tagline: 'Just cook it.',
    ingredients: ['2 lbs beef', '1 onion'], steps: ['Brown the meat.', 'Simmer.'],
    story: 'It was 1984.', notes: null, tags: [], category: { id: 3, slug: 'mains', name: 'Mains', sort_order: 3 },
    gear: [{ id: 1, recipe_id: 1, label: 'Cast-iron pot', url: 'https://x', blurb: 'Sal swears by it.', sort_order: 0 }],
  }),
  getRelatedRecipes: vi.fn().mockResolvedValue([]),
}))

import RecipePage from './Recipe'

beforeEach(() => vi.clearAllMocks())

describe('Recipe', () => {
  it('renders ingredients, steps, gear, and story', async () => {
    render(<MemoryRouter initialEntries={['/recipe/chili']}><Routes><Route path="recipe/:slug" element={<RecipePage />} /></Routes></MemoryRouter>)
    expect(await screen.findByText('Bet-Winning Chili')).toBeInTheDocument()
    expect(screen.getByText('2 lbs beef')).toBeInTheDocument()
    expect(screen.getByText('Brown the meat.')).toBeInTheDocument()
    expect(screen.getByText(/Cast-iron pot/)).toBeInTheDocument()
    expect(screen.getByText(/It was 1984/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it — Expected: FAIL.**

- [ ] **Step 3: Implement `src/pages/Recipe.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getRecipeBySlug, getRelatedRecipes } from '../lib/recipes'
import type { Recipe, RecipeWithExtras } from '../lib/types'
import RecipeCard from '../components/RecipeCard'

export default function RecipePage() {
  const { slug } = useParams()
  const [recipe, setRecipe] = useState<RecipeWithExtras | null>(null)
  const [related, setRelated] = useState<Recipe[]>([])
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    getRecipeBySlug(slug).then((r) => {
      if (!r) { setNotFound(true); return }
      setRecipe(r)
      getRelatedRecipes(r).then(setRelated).catch(console.error)
    }).catch(console.error)
  }, [slug])

  if (notFound) return <h1 className="font-display-lg text-display-lg uppercase">Never heard of it.</h1>
  if (!recipe) return <p className="font-label-mono text-label-mono">Pulling the card…</p>

  return (
    <>
      {/* Above the fold: title/photo + Hardware/Execution */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-stack-lg">
        <div className="md:col-span-5 flex flex-col gap-stack-md">
          <div className="bg-surface border-2 border-on-background p-4 brutalist-offset">
            {recipe.category && <div className="bg-primary-container text-on-primary-container font-label-caps text-label-caps inline-block px-2 py-1 mb-2 border border-on-background uppercase">{recipe.category.name}</div>}
            <h1 className="font-display-lg text-display-lg mb-2 uppercase leading-none">{recipe.name}</h1>
            {recipe.tagline && <p className="font-body-md text-body-md italic text-on-surface-variant">"{recipe.tagline}"</p>}
          </div>
          {recipe.photo_url && (
            <div className="border-2 border-on-background aspect-square relative overflow-hidden brutalist-offset">
              <img className="w-full h-full object-cover grayscale-[20%] contrast-125" src={recipe.photo_url} alt={recipe.name} />
            </div>
          )}
        </div>

        <div className="md:col-span-7 bg-surface border-2 border-on-background p-6 brutalist-offset flex flex-col h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter flex-grow">
            <div>
              <h2 className="font-headline-md text-headline-md border-b-4 border-on-background mb-4 pb-1 uppercase">Hardware</h2>
              <ul className="font-label-mono text-label-mono space-y-2 grease-stain-list">
                {recipe.ingredients.map((i, idx) => <li key={idx}>{i}</li>)}
              </ul>
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md border-b-4 border-on-background mb-4 pb-1 uppercase">Execution</h2>
              <ol className="font-body-sm text-body-sm space-y-4 list-decimal list-inside">
                {recipe.steps.map((s, idx) => <li key={idx}>{s}</li>)}
              </ol>
            </div>
          </div>

          {/* Recommended Gear (affiliate) */}
          {recipe.gear.length > 0 && (
            <div className="mt-6 pt-4 border-t-2 border-on-background flex flex-col gap-3">
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">Recommended Gear</span>
              {recipe.gear.map((g) => (
                <div key={g.id} className="flex justify-between items-center bg-surface-container p-4 gap-4">
                  <span className="font-label-mono text-label-mono text-on-surface-variant flex-1">{g.blurb || g.label}</span>
                  <a href={g.url} target="_blank" rel="noopener noreferrer nofollow sponsored"
                    className="bg-primary-container text-on-primary border-2 border-on-background px-4 py-2 font-label-caps text-label-caps uppercase brutalist-btn-offset whitespace-nowrap">
                    {g.label}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* The Story */}
      {recipe.story && (
        <>
          <hr className="serrated my-12 opacity-50" />
          <section className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-stack-lg">
            <div className="md:col-start-3 md:col-span-8">
              <div className="bg-surface border border-on-background p-8 md:p-12 relative brutalist-offset">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-[#d2b48c] opacity-80 border border-on-background rotate-[-2deg]" />
                <h2 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-center mb-6 uppercase border-b-2 border-on-background pb-2 w-full">The Story</h2>
                <div className="font-body-lg text-body-lg space-y-6 columns-1 md:columns-2 gap-8 text-justify" style={{ columnRule: '1px solid #1b1c1a' }}>
                  {recipe.story.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Notes (kitchen scrawl) */}
      {recipe.notes && (
        <section className="mb-stack-lg">
          <div className="bg-surface-container border-l-4 border-primary p-4 font-label-mono text-label-mono text-on-surface-variant">
            <span className="uppercase font-bold">Scrawled on the card: </span>{recipe.notes}
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section>
          <hr className="border-t-2 border-on-background my-12" />
          <h3 className="font-headline-md text-headline-md uppercase mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined">folder_open</span> Other Stuff You Might Like
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {related.map((r) => <RecipeCard key={r.id} recipe={r} />)}
          </div>
        </section>
      )}
    </>
  )
}
```

- [ ] **Step 4: Wire the route** — replace the Recipe stub with `<Route path="recipe/:slug" element={<RecipePage />} />` and import it.

- [ ] **Step 5: Run test — Expected: PASS.**

- [ ] **Step 6: Visual check** against `design-reference/recipe.html`: ingredients/steps visible without scrolling, serrated rule before The Story, two-column justified story.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Recipe.tsx src/pages/Recipe.test.tsx src/App.tsx
git commit -m "feat: Recipe detail page — recipe-first layout, gear box, story, related"
```

---

## Task 10: Auth — context, Login page, ProtectedRoute, live nav

**Files:**
- Create: `src/context/AuthContext.tsx`, `src/pages/Login.tsx`, `src/components/ProtectedRoute.tsx`
- Modify: `src/main.tsx` (wrap in `<AuthProvider>`), `src/components/TopNav.tsx` (live login state), `src/App.tsx`
- Test: `src/pages/Login.test.tsx`

**Interfaces:**
- Produces:
  - `useAuth(): { session: Session | null; isEditor: boolean; loading: boolean; signIn(email,password): Promise<{error?:string}>; signOut(): Promise<void> }`
  - `<AuthProvider>` (wraps app)
  - `<ProtectedRoute>` — redirects non-editors to `/login`.
- Consumed by TopNav and Task 11 (EditRecipe).

- [ ] **Step 1: Implement `src/context/AuthContext.tsx`**

```tsx
import { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthValue {
  session: Session | null
  isEditor: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | undefined>(undefined)

async function checkEditor(userId: string | undefined): Promise<boolean> {
  if (!userId) return false
  const { data } = await supabase.from('editors').select('user_id').eq('user_id', userId).maybeSingle()
  return !!data
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isEditor, setIsEditor] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      setIsEditor(await checkEditor(data.session?.user.id))
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s)
      setIsEditor(await checkEditor(s?.user.id))
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? { error: error.message } : {}
  }
  async function signOut() { await supabase.auth.signOut() }

  return <AuthContext.Provider value={{ session, isEditor, loading, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 2: Wrap the app** — in `src/main.tsx`, import `AuthProvider` and wrap `<App/>` inside `<HashRouter>`:

```tsx
<HashRouter>
  <AuthProvider>
    <App />
  </AuthProvider>
</HashRouter>
```

- [ ] **Step 3: Write failing test `src/pages/Login.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const signIn = vi.fn()
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ session: null, isEditor: false, loading: false, signIn, signOut: vi.fn() }) }))

import Login from './Login'

beforeEach(() => vi.clearAllMocks())

describe('Login', () => {
  it('calls signIn with entered credentials', async () => {
    signIn.mockResolvedValue({})
    render(<MemoryRouter><Login /></MemoryRouter>)
    await userEvent.type(screen.getByLabelText(/email/i), 'dad@family.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /let me in/i }))
    expect(signIn).toHaveBeenCalledWith('dad@family.com', 'secret')
  })
})
```

> Add `"@testing-library/user-event": "^14.5.2"` to devDependencies and `npm install`.

- [ ] **Step 4: Run it — Expected: FAIL.**

- [ ] **Step 5: Implement `src/pages/Login.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { session, isEditor, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { if (session && isEditor) navigate('/add') }, [session, isEditor, navigate])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    const res = await signIn(email, password)
    setBusy(false)
    if (res.error) setError(res.error)
  }

  return (
    <div className="max-w-md mx-auto">
      <header className="border-l-4 border-primary pl-4 py-1 mb-stack-lg">
        <h1 className="font-display-lg text-display-lg uppercase">Family Only</h1>
        <p className="font-label-mono text-label-mono text-on-surface-variant mt-2">If you have to ask, you're not on the list.</p>
      </header>
      <form onSubmit={submit} className="index-card p-6 flex flex-col gap-stack-md">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="font-label-caps text-label-caps uppercase">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="brutal-input bg-transparent border-0 brutal-border-bottom w-full font-body-md text-body-md py-2 px-0 outline-none" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="font-label-caps text-label-caps uppercase">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            className="brutal-input bg-transparent border-0 brutal-border-bottom w-full font-body-md text-body-md py-2 px-0 outline-none" />
        </div>
        {error && <p className="font-label-mono text-label-mono text-error">{error}</p>}
        <button type="submit" disabled={busy}
          className="bg-primary text-on-primary brutal-border brutal-shadow py-4 px-6 font-headline-sm text-headline-sm uppercase brutal-btn disabled:opacity-50">
          {busy ? 'Checking…' : 'Let Me In'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 6: Implement `src/components/ProtectedRoute.tsx`**

```tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isEditor, loading } = useAuth()
  if (loading) return <p className="font-label-mono text-label-mono">…</p>
  if (!session || !isEditor) return <Navigate to="/login" replace />
  return <>{children}</>
}
```

- [ ] **Step 7: Make TopNav reflect auth state** — replace the static LOGIN link in `src/components/TopNav.tsx` with:

```tsx
// add at top: import { useAuth } from '../context/AuthContext'
// inside component: const { session, isEditor, signOut } = useAuth()
// replace the LOGIN <Link> with:
{session && isEditor ? (
  <>
    <Link to="/add" className="brutal-btn hidden md:inline-block bg-surface border-2 border-on-background px-4 py-2 font-label-caps text-label-caps uppercase">+ ADD</Link>
    <button onClick={() => signOut()} className="hidden md:inline-block font-label-caps text-label-caps uppercase text-on-surface hover:text-primary">LOGOUT</button>
  </>
) : (
  <Link to="/login" className="brutal-btn hidden md:inline-block bg-primary-container text-on-primary-container border-2 border-on-background px-6 py-2 font-label-caps text-label-caps uppercase transition-all">LOGIN</Link>
)}
```

- [ ] **Step 8: Wire routes** — in `src/App.tsx` set `<Route path="login" element={<Login />} />` and leave `add`/`edit` stubs for Task 11. Import `Login`.

- [ ] **Step 9: Run test — Expected: PASS.** `npx vitest run src/pages/Login.test.tsx`

- [ ] **Step 10: Commit**

```bash
git add src/context/AuthContext.tsx src/pages/Login.tsx src/pages/Login.test.tsx src/components/ProtectedRoute.tsx src/components/TopNav.tsx src/main.tsx src/App.tsx package.json package-lock.json
git commit -m "feat: editor auth — context, login page, protected routes, live nav"
```

---

## Task 11: Add/Edit recipe form (with photo upload + gear)

**Files:**
- Create: `src/pages/EditRecipe.tsx`
- Modify: `src/lib/recipes.ts` (add `saveRecipe`, `uploadPhoto`), `src/App.tsx`
- Test: `src/pages/EditRecipe.test.tsx`

**Interfaces:**
- Consumes: `useAuth` (Task 10), `listCategories`, `getRecipeBySlug` (Task 4), `slugify` (Task 3).
- Produces (added to `src/lib/recipes.ts`):
  ```ts
  export interface GearInput { label: string; url: string; blurb: string }
  export interface RecipeInput {
    id?: number; slug: string; name: string; tagline: string; story: string
    ingredients: string[]; steps: string[]; category_id: number | null; photo_url: string | null
  }
  export function uploadPhoto(file: File): Promise<string>           // returns public URL
  export function saveRecipe(input: RecipeInput, gear: GearInput[]): Promise<Recipe>
  ```

- [ ] **Step 1: Add `uploadPhoto` and `saveRecipe` to `src/lib/recipes.ts`**

```ts
export interface GearInput { label: string; url: string; blurb: string }
export interface RecipeInput {
  id?: number; slug: string; name: string; tagline: string; story: string
  ingredients: string[]; steps: string[]; category_id: number | null; photo_url: string | null
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
  }
  const { data, error } = input.id
    ? await supabase.from('recipes').update(row).eq('id', input.id).select().single()
    : await supabase.from('recipes').insert(row).select().single()
  if (error) throw error
  const saved = data as Recipe

  // Replace gear rows
  await supabase.from('recipe_gear').delete().eq('recipe_id', saved.id)
  const validGear = gear.filter((g) => g.label.trim() && g.url.trim())
  if (validGear.length) {
    const { error: gErr } = await supabase.from('recipe_gear').insert(
      validGear.map((g, i) => ({ recipe_id: saved.id, label: g.label, url: g.url, blurb: g.blurb || null, sort_order: i })),
    )
    if (gErr) throw gErr
  }
  return saved
}
```

- [ ] **Step 2: Write failing test `src/pages/EditRecipe.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const saveRecipe = vi.fn()
vi.mock('../lib/recipes', () => ({
  listCategories: vi.fn().mockResolvedValue([{ id: 3, slug: 'mains', name: 'Mains', sort_order: 3 }]),
  getRecipeBySlug: vi.fn(),
  uploadPhoto: vi.fn(),
  saveRecipe: (...a: unknown[]) => saveRecipe(...a),
}))
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ session: {}, isEditor: true, loading: false }) }))

import EditRecipe from './EditRecipe'

beforeEach(() => vi.clearAllMocks())

describe('EditRecipe', () => {
  it('saves a new recipe with title and one ingredient/step', async () => {
    saveRecipe.mockResolvedValue({ slug: 'sunday-gravy' })
    render(<MemoryRouter><EditRecipe /></MemoryRouter>)
    await screen.findByText(/ADD TO THE ARCHIVE/i)
    await userEvent.type(screen.getByPlaceholderText(/Uncle Sal's Sunday Gravy/i), 'Sunday Gravy')
    await userEvent.type(screen.getAllByPlaceholderText(/2 cups flour|1 tsp salt/i)[0], '2 cups flour')
    await userEvent.type(screen.getByPlaceholderText(/Describe the first step/i), 'Simmer all day.')
    await userEvent.click(screen.getByRole('button', { name: /SAVE TO THE ARCHIVE/i }))
    await waitFor(() => expect(saveRecipe).toHaveBeenCalled())
    const [input] = saveRecipe.mock.calls[0]
    expect(input.name).toBe('Sunday Gravy')
    expect(input.slug).toBe('sunday-gravy')
    expect(input.ingredients).toContain('2 cups flour')
    expect(input.steps).toContain('Simmer all day.')
  })
})
```

- [ ] **Step 3: Run it — Expected: FAIL.**

- [ ] **Step 4: Implement `src/pages/EditRecipe.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { listCategories, getRecipeBySlug, uploadPhoto, saveRecipe, type GearInput } from '../lib/recipes'
import { slugify } from '../lib/slug'
import type { Category } from '../lib/types'

export default function EditRecipe() {
  const { slug: editSlug } = useParams()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [id, setId] = useState<number | undefined>()
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [story, setStory] = useState('')
  const [ingredients, setIngredients] = useState<string[]>([''])
  const [steps, setSteps] = useState<string[]>([''])
  const [gear, setGear] = useState<GearInput[]>([])
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { listCategories().then((c) => { setCategories(c); if (c[0]) setCategoryId((p) => p ?? c[0].id) }) }, [])
  useEffect(() => {
    if (!editSlug) return
    getRecipeBySlug(editSlug).then((r) => {
      if (!r) return
      setId(r.id); setName(r.name); setTagline(r.tagline ?? ''); setStory(r.story ?? '')
      setIngredients(r.ingredients.length ? r.ingredients : [''])
      setSteps(r.steps.length ? r.steps : [''])
      setCategoryId(r.category_id); setPhotoUrl(r.photo_url)
      setGear(r.gear.map((g) => ({ label: g.label, url: g.url, blurb: g.blurb ?? '' })))
    })
  }, [editSlug])

  function setAt<T>(list: T[], i: number, v: T) { const c = [...list]; c[i] = v; return c }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    try { setPhotoUrl(await uploadPhoto(file)) } catch (err) { setError(String(err)) }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('It needs a name.'); return }
    setBusy(true); setError('')
    try {
      const saved = await saveRecipe(
        { id, slug: slugify(name), name: name.trim(), tagline, story,
          ingredients: ingredients.map((s) => s.trim()).filter(Boolean),
          steps: steps.map((s) => s.trim()).filter(Boolean),
          category_id: categoryId, photo_url: photoUrl },
        gear,
      )
      navigate(`/recipe/${saved.slug}`)
    } catch (err) { setError(String(err)); setBusy(false) }
  }

  const labelCaps = 'font-label-caps text-label-caps text-on-background uppercase'
  const brutalInput = 'brutal-input bg-transparent border-0 brutal-border-bottom w-full py-2 px-0 outline-none'

  return (
    <>
      <header className="mb-stack-lg border-l-4 border-primary pl-4 py-1">
        <h1 className="font-display-lg text-display-lg text-on-background uppercase">{id ? 'Fix the Archive' : 'Add to the Archive'}</h1>
        <p className="font-label-mono text-label-mono text-on-surface-variant mt-2 max-w-2xl">Don't mess this up. Make sure the steps actually make sense.</p>
      </header>

      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Left column */}
        <div className="md:col-span-8 flex flex-col gap-stack-lg">
          <div className="index-card p-6 relative">
            <div className="absolute top-0 left-0 w-24 h-2 bg-primary" />
            <div className="flex flex-col gap-stack-md mt-2">
              <div className="flex flex-col gap-2">
                <label className={labelCaps} htmlFor="title">What's it called?</label>
                <input id="title" value={name} onChange={(e) => setName(e.target.value)}
                  className={`${brutalInput} font-headline-md text-headline-md`} placeholder="e.g., Uncle Sal's Sunday Gravy" />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelCaps} htmlFor="tagline">The one-liner (optional)</label>
                <input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)}
                  className={`${brutalInput} font-body-md text-body-md`} placeholder="Better than yours." />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelCaps} htmlFor="story">The Story (optional — keep it short, nobody likes a novel)</label>
                <textarea id="story" value={story} onChange={(e) => setStory(e.target.value)} rows={3}
                  className={`${brutalInput} font-body-md text-body-md resize-none`} placeholder="Where did this come from?" />
              </div>
            </div>
          </div>

          <hr className="paper-hr" />

          {/* Ingredients */}
          <div className="index-card p-6 relative border-l-4 border-l-primary">
            <h2 className="font-headline-sm text-headline-sm mb-4 uppercase">What goes in it? (Ingredients)</h2>
            <div className="flex flex-col gap-3 font-label-mono text-label-mono">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={ing} onChange={(e) => setIngredients(setAt(ingredients, i, e.target.value))}
                    className="brutal-input flex-grow bg-transparent border-0 brutal-border-bottom py-1 px-0 outline-none" placeholder={i === 0 ? '2 cups flour' : '1 tsp salt'} />
                  <button type="button" onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))} className="text-on-background hover:text-error"><span className="material-symbols-outlined">close</span></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setIngredients([...ingredients, ''])}
              className="mt-4 font-label-caps text-label-caps border border-on-background px-4 py-2 hover:bg-surface-container inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">add</span> ADD INGREDIENT
            </button>
          </div>

          {/* Steps */}
          <div className="index-card p-6 relative">
            <div className="absolute top-0 left-0 w-24 h-2 bg-on-background" />
            <h2 className="font-headline-sm text-headline-sm mb-4 mt-2 uppercase">How do you make it? (Steps)</h2>
            <div className="flex flex-col gap-6">
              {steps.map((st, i) => (
                <div key={i} className="flex gap-4">
                  <div className="font-headline-md text-headline-md text-surface-dim mt-[-4px]">{i + 1}</div>
                  <textarea value={st} onChange={(e) => setSteps(setAt(steps, i, e.target.value))} rows={2}
                    className="brutal-input flex-grow bg-transparent border-0 brutal-border-bottom py-1 px-0 outline-none resize-none font-body-md text-body-md" placeholder={i === 0 ? 'Describe the first step clearly.' : 'Then what?'} />
                  <button type="button" onClick={() => setSteps(steps.filter((_, j) => j !== i))} className="text-on-background hover:text-error"><span className="material-symbols-outlined">close</span></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setSteps([...steps, ''])}
              className="mt-6 font-label-caps text-label-caps border border-on-background px-4 py-2 hover:bg-surface-container inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">add</span> ADD STEP
            </button>
          </div>

          {/* Gear */}
          <div className="index-card p-6">
            <h2 className="font-headline-sm text-headline-sm mb-4 uppercase">Recommended Gear (optional)</h2>
            <div className="flex flex-col gap-4">
              {gear.map((g, i) => (
                <div key={i} className="flex flex-col gap-2 border-b border-on-background pb-3">
                  <div className="flex gap-2">
                    <input value={g.label} onChange={(e) => setGear(setAt(gear, i, { ...g, label: e.target.value }))} className="brutal-input flex-1 bg-transparent border-0 brutal-border-bottom py-1 px-0 outline-none font-label-mono text-label-mono" placeholder="Cast-iron pot" />
                    <button type="button" onClick={() => setGear(gear.filter((_, j) => j !== i))} className="text-on-background hover:text-error"><span className="material-symbols-outlined">close</span></button>
                  </div>
                  <input value={g.url} onChange={(e) => setGear(setAt(gear, i, { ...g, url: e.target.value }))} className="brutal-input bg-transparent border-0 brutal-border-bottom py-1 px-0 outline-none font-label-mono text-label-mono" placeholder="https://affiliate-link..." />
                  <input value={g.blurb} onChange={(e) => setGear(setAt(gear, i, { ...g, blurb: e.target.value }))} className="brutal-input bg-transparent border-0 brutal-border-bottom py-1 px-0 outline-none font-label-mono text-label-mono" placeholder="The one Grandpa swore by." />
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setGear([...gear, { label: '', url: '', blurb: '' }])}
              className="mt-4 font-label-caps text-label-caps border border-on-background px-4 py-2 hover:bg-surface-container inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">add</span> ADD GEAR
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="md:col-span-4 flex flex-col gap-stack-lg">
          <div className="flex flex-col gap-2">
            <label className={labelCaps}>Upload the evidence (photo)</label>
            <label className="w-full aspect-square brutal-border bg-surface-container flex flex-col items-center justify-center cursor-pointer hover:bg-surface-variant transition-colors relative overflow-hidden">
              {photoUrl && <img src={photoUrl} alt="recipe" className="absolute inset-0 w-full h-full object-cover" />}
              <div className="z-10 flex flex-col items-center text-center p-4">
                <span className="material-symbols-outlined text-4xl mb-2 text-on-background">add_a_photo</span>
                <span className="font-label-mono text-label-mono block text-on-background bg-surface px-2 py-1 brutal-border">CLICK TO UPLOAD</span>
              </div>
              <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
            </label>
          </div>

          <div className="flex flex-col gap-2 index-card p-4">
            <label className={labelCaps} htmlFor="category">Category</label>
            <select id="category" value={categoryId ?? ''} onChange={(e) => setCategoryId(Number(e.target.value))}
              className="brutal-input bg-transparent border-0 brutal-border-bottom w-full font-body-md text-body-md py-2 px-0 appearance-none rounded-none cursor-pointer outline-none">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {error && <p className="font-label-mono text-label-mono text-error">{error}</p>}

          <div className="mt-auto pt-8">
            <button type="submit" disabled={busy}
              className="w-full bg-primary text-on-primary brutal-border brutal-shadow py-4 px-6 font-headline-sm text-headline-sm uppercase flex justify-center items-center gap-2 brutal-btn disabled:opacity-50">
              {busy ? 'Saving…' : 'Save to the Archive'} <span className="material-symbols-outlined">archive</span>
            </button>
          </div>
        </div>
      </form>
    </>
  )
}
```

- [ ] **Step 5: Wire protected routes** — in `src/App.tsx` import `EditRecipe` and `ProtectedRoute`, and replace the `add`/`edit` stubs:

```tsx
<Route path="add" element={<ProtectedRoute><EditRecipe /></ProtectedRoute>} />
<Route path="edit/:slug" element={<ProtectedRoute><EditRecipe /></ProtectedRoute>} />
```

- [ ] **Step 6: Run test — Expected: PASS.** `npx vitest run src/pages/EditRecipe.test.tsx`

- [ ] **Step 7: Full test + build** — `npm run test` (all green) and `npm run build` (succeeds).

- [ ] **Step 8: Commit**

```bash
git add src/pages/EditRecipe.tsx src/pages/EditRecipe.test.tsx src/lib/recipes.ts src/App.tsx
git commit -m "feat: add/edit recipe form with photo upload and per-recipe gear"
```

---

## Task 12: GitHub Actions deploy + README runbook

**Files:**
- Create: `.github/workflows/deploy.yml`, `README.md`

**Interfaces:** none (delivery/ops).

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Create `README.md` with the post-creation runbook**

````markdown
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
````

- [ ] **Step 3: Verify the build command the workflow runs**

Run: `npm ci && npm run build`
Expected: succeeds, `dist/index.html` exists.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml README.md
git commit -m "ci: GitHub Pages deploy workflow and setup runbook"
```

---

## Self-Review

**Spec coverage:**
- Browse all recipes → Task 8 ✓
- Read a single recipe (recipe-first, story below, related, gear) → Task 9 ✓
- Search / filter by name + category → Tasks 7, 8 ✓
- Editor experience (simple form, login) → Tasks 10, 11 ✓
- Recipe of the Week → Tasks 4 (`getRecipeOfWeek`), 7 ✓
- Related recipes → Tasks 4 (`getRelatedRecipes`), 9 ✓
- Affiliate "Recommended Gear" per recipe → Tasks 2 (`recipe_gear`), 9, 11 ✓
- 565 CSV recipes imported as-is, tags→category, blank taglines/stories → Tasks 2, 3 ✓
- Grumpy Uncle Kitchen visual fidelity → Task 1 tokens + Tasks 5–11 ported markup ✓
- GitHub Pages + Supabase, plumbing-now/activate-later → Tasks 1, 2, 12 ✓
- Editor allowlist + RLS write restriction → Tasks 2, 10 ✓

**Placeholder scan:** No TBD/TODO; every code step contains full code.

**Type consistency:** `Recipe`, `Category`, `Gear`, `RecipeWithExtras`, `RecipeInput`, `GearInput` defined in Tasks 4/11 and used consistently. Data-access names (`listRecipes`, `getRecipeBySlug`, `getRecipeOfWeek`, `getRelatedRecipes`, `listCategories`, `saveRecipe`, `uploadPhoto`) match across consumers. `is_editor()` SQL function name consistent across migrations.

**Known limitation surfaced:** Real recipe photos aren't in the CSV — imported recipes show a "NO PHOTO YET" placeholder until an editor uploads one (Task 6 fallback). This is expected per the spec (photos are editor-supplied).
