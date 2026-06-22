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
