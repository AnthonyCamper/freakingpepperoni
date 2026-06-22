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
