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
            <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg mb-2 uppercase leading-none break-words">{recipe.name}</h1>
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
                    className="tap inline-flex items-center bg-primary-container text-on-primary border-2 border-on-background px-4 py-2 font-label-caps text-label-caps uppercase brutalist-btn-offset whitespace-nowrap">
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
                <div className="font-body-lg text-body-lg space-y-6 columns-1 md:columns-2 gap-8 text-left md:text-justify" style={{ columnRule: '1px solid #1b1c1a' }}>
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
