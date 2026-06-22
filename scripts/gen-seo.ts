// Post-build: write dist/sitemap.xml and dist/robots.txt.
//
// Pulls every published recipe slug from Supabase (anon key — public read) so
// search engines get one URL per recipe instead of just the homepage. Resilient
// by design: if the DB is unreachable or env vars are missing it still emits the
// static routes, so `npm run build` never fails over SEO generation.
//
// Run automatically by `npm run build`, or standalone via `npm run gen:seo`.
import { writeFileSync } from 'node:fs'
import ws from 'ws'
import { buildSitemap, buildRobots, type SitemapEntry } from '../src/lib/sitemap.ts'

// supabase-js builds a realtime client that needs a global WebSocket on Node < 22.
// Shim it before the dynamic import below (same pattern as scripts/backfill-nutrition).
;(globalThis as { WebSocket?: unknown }).WebSocket ??= ws

const SITE_URL = (process.env.VITE_SITE_URL || 'https://anthonycamper.github.io/freakingpepperoni').replace(/\/$/, '')
const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY

const entries: SitemapEntry[] = [
  { path: '/', changefreq: 'weekly', priority: 1.0 },
  { path: '/browse', changefreq: 'weekly', priority: 0.8 },
]

if (url && anonKey) {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(url, anonKey)
    const { data, error } = await supabase
      .from('recipes')
      .select('slug, updated_at')
      .eq('is_published', true)
      .order('name')
    if (error) throw error
    for (const r of (data ?? []) as { slug: string; updated_at: string | null }[]) {
      entries.push({
        path: `/recipe/${r.slug}`,
        lastmod: r.updated_at?.slice(0, 10),
        changefreq: 'monthly',
        priority: 0.7,
      })
    }
    console.log(`gen-seo: loaded ${data?.length ?? 0} published recipes`)
  } catch (e) {
    console.warn('gen-seo: could not load recipes, emitting static routes only —', (e as Error).message)
  }
} else {
  console.warn('gen-seo: Supabase env vars missing, emitting static routes only')
}

writeFileSync(new URL('../dist/sitemap.xml', import.meta.url), buildSitemap(SITE_URL, entries))
writeFileSync(new URL('../dist/robots.txt', import.meta.url), buildRobots(SITE_URL))
console.log(`gen-seo: wrote dist/sitemap.xml (${entries.length} urls) + dist/robots.txt → ${SITE_URL}`)
