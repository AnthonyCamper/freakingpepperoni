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
        <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg uppercase break-words">THE ARCHIVE</h1>
        <p className="font-label-mono text-label-mono text-on-surface-variant mt-2">Everything the family will admit to cooking.</p>
      </header>

      <div className="relative flex items-center">
        <span className="material-symbols-outlined absolute left-0 text-on-surface-variant text-3xl">arrow_forward</span>
        <input value={q} onChange={(e) => setParams((p) => { p.set('q', e.target.value); return p }, { replace: true })}
          className="w-full bg-transparent border-0 border-b-4 border-on-background pl-10 py-2 font-headline-sm text-headline-sm focus:border-primary placeholder:text-surface-dim outline-none rounded-none"
          placeholder="Find what you're looking for..." />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to="/browse" className={`tap inline-flex items-center font-label-mono text-label-mono brutal-border px-3 py-2 ${!c ? 'bg-primary-container text-on-primary-container' : 'bg-surface'}`}>ALL</Link>
        {categories.map((cat) => (
          <Link key={cat.id} to={`/browse?c=${cat.slug}`}
            className={`tap inline-flex items-center font-label-mono text-label-mono brutal-border px-3 py-2 ${c === cat.slug ? 'bg-primary-container text-on-primary-container' : 'bg-surface hover:bg-primary-container hover:text-on-primary-container'} transition-colors`}>
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
