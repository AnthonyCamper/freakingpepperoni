// One-time bulk load of /tmp/foods/foods.json into public.foods via the
// temporary import_foods() RPC. Run after gen-foods-sql.ts:
//   npx tsx scripts/load-foods.ts
import { readFileSync } from 'node:fs'
import ws from 'ws'
import { createClient } from '@supabase/supabase-js'

// supabase-js constructs a realtime client that needs a global WebSocket on Node < 22.
;(globalThis as { WebSocket?: unknown }).WebSocket ??= ws

// Read VITE_SUPABASE_* from .env.local without a dotenv dependency.
const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const get = (k: string) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '')
const supabase = createClient(get('VITE_SUPABASE_URL')!, get('VITE_SUPABASE_ANON_KEY')!)

const rows: Record<string, unknown>[] = JSON.parse(readFileSync('/tmp/foods/foods.json', 'utf8'))
const CHUNK = 500
let loaded = 0
for (let i = 0; i < rows.length; i += CHUNK) {
  const chunk = rows.slice(i, i + CHUNK)
  const { data, error } = await supabase.rpc('import_foods', { rows: chunk })
  if (error) { console.error('chunk', i, error.message); process.exit(1) }
  loaded += data as number
  process.stdout.write(`\r${Math.min(i + CHUNK, rows.length)}/${rows.length} inserted=${loaded}`)
}
console.log(`\ndone: ${loaded} foods loaded`)
