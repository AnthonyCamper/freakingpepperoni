import { describe, it, expect } from 'vitest'
import { buildSitemap, buildRobots, type SitemapEntry } from './sitemap'

const SITE = 'https://anthonycamper.github.io/freakingpepperoni'

describe('buildSitemap', () => {
  it('emits a valid urlset with one <url> per entry', () => {
    const entries: SitemapEntry[] = [
      { path: '/' },
      { path: '/browse' },
      { path: '/recipe/grandmas-lasagna' },
    ]
    const xml = buildSitemap(SITE, entries)
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect((xml.match(/<url>/g) ?? []).length).toBe(3)
    expect(xml).toContain(`<loc>${SITE}/</loc>`)
    expect(xml).toContain(`<loc>${SITE}/recipe/grandmas-lasagna</loc>`)
  })

  it('includes lastmod, changefreq and priority when provided', () => {
    const xml = buildSitemap(SITE, [
      { path: '/recipe/x', lastmod: '2026-01-02', changefreq: 'monthly', priority: 0.7 },
    ])
    expect(xml).toContain('<lastmod>2026-01-02</lastmod>')
    expect(xml).toContain('<changefreq>monthly</changefreq>')
    expect(xml).toContain('<priority>0.7</priority>')
  })

  it('omits optional fields when not provided', () => {
    const xml = buildSitemap(SITE, [{ path: '/' }])
    expect(xml).not.toContain('<lastmod>')
    expect(xml).not.toContain('<priority>')
  })

  it('XML-escapes special characters in the path', () => {
    const xml = buildSitemap(SITE, [{ path: '/recipe/mac-&-cheese' }])
    expect(xml).toContain('mac-&amp;-cheese')
    expect(xml).not.toContain('mac-&-cheese')
  })

  it('never produces a double slash between origin and root path', () => {
    const xml = buildSitemap(SITE + '/', [{ path: '/' }])
    expect(xml).toContain(`<loc>${SITE}/</loc>`)
    expect(xml).not.toContain('freakingpepperoni//')
  })
})

describe('buildRobots', () => {
  it('allows crawling, blocks editor routes, and points to the sitemap', () => {
    const txt = buildRobots(SITE)
    expect(txt).toContain('User-agent: *')
    expect(txt).toContain('Allow: /')
    expect(txt).toContain('Disallow: /login')
    expect(txt).toContain('Disallow: /add')
    expect(txt).toContain('Disallow: /edit/')
    expect(txt).toContain(`Sitemap: ${SITE}/sitemap.xml`)
  })
})
