// Pure builders for sitemap.xml and robots.txt. Kept free of any I/O so they're
// unit-testable; scripts/gen-seo.ts wires them to Supabase + the filesystem at
// build time. The app is a client-rendered SPA, so a real sitemap is how search
// engines discover the one-URL-per-recipe routes (BrowserRouter, not hashes).

export interface SitemapEntry {
  /** Absolute path beginning with "/", e.g. "/recipe/grandmas-lasagna". */
  path: string
  /** ISO date (YYYY-MM-DD). */
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Join a site origin (with or without trailing slash) and a root-relative path. */
function joinUrl(siteUrl: string, path: string): string {
  return siteUrl.replace(/\/$/, '') + (path.startsWith('/') ? path : `/${path}`)
}

export function buildSitemap(siteUrl: string, entries: SitemapEntry[]): string {
  const urls = entries.map((e) => {
    const parts = [`    <loc>${xmlEscape(joinUrl(siteUrl, e.path))}</loc>`]
    if (e.lastmod) parts.push(`    <lastmod>${e.lastmod}</lastmod>`)
    if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`)
    if (e.priority != null) parts.push(`    <priority>${e.priority}</priority>`)
    return `  <url>\n${parts.join('\n')}\n  </url>`
  })
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n')
}

export function buildRobots(siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, '')
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /login',
    'Disallow: /add',
    'Disallow: /edit/',
    '',
    `Sitemap: ${base}/sitemap.xml`,
    '',
  ].join('\n')
}
