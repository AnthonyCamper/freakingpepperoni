import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getRecipeBySlug, getRelatedRecipes } from '../lib/recipes'
import type { Recipe, RecipeWithExtras } from '../lib/types'
import { transformIngredient, parseServings, type UnitSystem } from '../lib/ingredients'
import { estimateNutrition } from '../lib/nutrition'
import RecipeCard from '../components/RecipeCard'
import NutritionLabel from '../components/NutritionLabel'
import CookingMode from '../components/CookingMode'
import Seo from '../components/Seo'
import { recipeJsonLd } from '../lib/seo'

export default function RecipePage() {
  const { slug } = useParams()
  const [recipe, setRecipe] = useState<RecipeWithExtras | null>(null)
  const [related, setRelated] = useState<Recipe[]>([])
  const [notFound, setNotFound] = useState(false)

  // Auto-conversion controls (shared with cooking mode).
  const [servings, setServings] = useState<number | null>(null)
  const [system, setSystem] = useState<UnitSystem>('original')
  const [cooking, setCooking] = useState(false)

  useEffect(() => {
    if (!slug) return
    setRecipe(null); setNotFound(false); setServings(null); setSystem('original')
    getRecipeBySlug(slug).then((r) => {
      if (!r) { setNotFound(true); return }
      setRecipe(r)
      getRelatedRecipes(r).then(setRelated).catch(console.error)
    }).catch(console.error)
  }, [slug])

  const baseServings = useMemo(
    () => recipe?.base_servings || parseServings(recipe?.servings ?? null, 4),
    [recipe],
  )
  const current = servings ?? baseServings
  const factor = current / baseServings

  // Scale + convert every ingredient line for display.
  const scaledIngredients = useMemo(
    () => (recipe?.ingredients ?? []).map((i) => transformIngredient(i, factor, system)),
    [recipe, factor, system],
  )

  // Nutrition: prefer stored facts, fall back to an ingredient estimate.
  const nutrition = useMemo(() => {
    if (!recipe) return null
    if (recipe.nutrition) return recipe.nutrition
    const est = estimateNutrition(recipe.ingredients, baseServings)
    return est.matched >= 2 ? est.perServing : null
  }, [recipe, baseServings])

  if (notFound) return <h1 className="font-display-lg text-display-lg uppercase">Never heard of it.</h1>
  if (!recipe) return <p className="font-label-mono text-label-mono">Pulling the card…</p>

  const meta = [
    recipe.prep_time && { icon: 'timer', label: 'Prep', value: recipe.prep_time },
    recipe.cook_time && { icon: 'skillet', label: 'Cook', value: recipe.cook_time },
    recipe.total_time && { icon: 'schedule', label: 'Total', value: recipe.total_time },
    recipe.servings && { icon: 'group', label: 'Serves', value: recipe.servings },
  ].filter(Boolean) as { icon: string; label: string; value: string }[]

  const segBtn = (s: UnitSystem) =>
    `tap px-3 py-1.5 font-label-caps text-label-caps uppercase border-2 border-on-background -ml-0.5 first:ml-0 ${
      system === s ? 'bg-on-background text-background' : 'bg-surface hover:bg-surface-container'
    }`

  return (
    <>
      <Seo
        title={recipe.name}
        description={recipe.tagline || recipe.summary || undefined}
        image={recipe.photo_url}
        type="article"
        jsonLd={recipeJsonLd(recipe, window.location.href)}
      />

      {cooking && (
        <CookingMode
          name={recipe.name}
          ingredients={scaledIngredients}
          steps={recipe.steps}
          onClose={() => setCooking(false)}
        />
      )}

      {/* Above the fold: title/photo + Hardware/Execution */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-stack-lg">
        <div className="md:col-span-5 flex flex-col gap-stack-md">
          <div className="bg-surface border-2 border-on-background p-4 brutalist-offset">
            {recipe.category && <div className="bg-primary-container text-on-primary-container font-label-caps text-label-caps inline-block px-2 py-1 mb-2 border border-on-background uppercase">{recipe.category.name}</div>}
            <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg mb-2 uppercase leading-none break-words">{recipe.name}</h1>
            {recipe.tagline && <p className="font-body-md text-body-md italic text-on-surface-variant">"{recipe.tagline}"</p>}
          </div>

          {/* Quick stats */}
          {meta.length > 0 && (
            <div className={`grid ${meta.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-0 bg-surface border-2 border-on-background brutalist-offset`}>
              {meta.map((m, i) => (
                <div key={m.label} className={`flex items-center gap-2 p-3 border-on-background ${i % 2 === 0 && i !== meta.length - 1 ? 'border-r-2' : ''} ${i < meta.length - (meta.length % 2 === 0 ? 2 : 1) ? 'border-b-2' : ''}`}>
                  <span className="material-symbols-outlined text-primary">{m.icon}</span>
                  <div className="min-w-0">
                    <div className="font-label-caps text-label-caps uppercase text-on-surface-variant leading-none">{m.label}</div>
                    <div className="font-body-sm text-body-sm leading-tight truncate">{m.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {recipe.photo_url && (
            <div className="border-2 border-on-background aspect-square relative overflow-hidden brutalist-offset">
              <img className="w-full h-full object-cover grayscale-[20%] contrast-125" src={recipe.photo_url} alt={recipe.name} />
            </div>
          )}

          {/* Cook button — the headline action */}
          <button
            onClick={() => setCooking(true)}
            className="w-full bg-primary text-on-primary brutal-border brutal-shadow py-4 px-6 font-headline-sm text-headline-sm uppercase flex justify-center items-center gap-2 brutal-btn"
          >
            <span className="material-symbols-outlined">cooking</span> Start Cooking Mode
          </button>
        </div>

        <div className="md:col-span-7 bg-surface border-2 border-on-background p-6 brutalist-offset flex flex-col h-full">
          {/* Conversion controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b-2 border-on-background border-dashed">
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">Servings</span>
              <div className="flex items-center border-2 border-on-background">
                <button
                  onClick={() => setServings(Math.max(1, Math.round(current - 1)))}
                  className="tap w-9 h-9 flex items-center justify-center hover:bg-surface-container border-r-2 border-on-background"
                  aria-label="Fewer servings"
                ><span className="material-symbols-outlined text-[18px]">remove</span></button>
                <span className="w-10 text-center font-headline-sm text-headline-sm tabular-nums">{Math.round(current * 100) / 100}</span>
                <button
                  onClick={() => setServings(Math.round(current + 1))}
                  className="tap w-9 h-9 flex items-center justify-center hover:bg-surface-container border-l-2 border-on-background"
                  aria-label="More servings"
                ><span className="material-symbols-outlined text-[18px]">add</span></button>
              </div>
              {current !== baseServings && (
                <button onClick={() => setServings(baseServings)} className="tap font-label-caps text-label-caps uppercase text-primary underline">reset</button>
              )}
            </div>
            <div className="flex items-center">
              <button onClick={() => setSystem('original')} className={segBtn('original')}>As written</button>
              <button onClick={() => setSystem('us')} className={segBtn('us')}>US</button>
              <button onClick={() => setSystem('metric')} className={segBtn('metric')}>Metric</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter flex-grow">
            <div>
              <h2 className="font-headline-md text-headline-md border-b-4 border-on-background mb-4 pb-1 uppercase">Hardware</h2>
              <ul className="font-label-mono text-label-mono space-y-2 grease-stain-list">
                {scaledIngredients.map((i, idx) => <li key={idx}>{i}</li>)}
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

      {/* Nutrition */}
      {nutrition && (
        <section className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-stack-lg items-start">
          <div className="md:col-span-5 lg:col-span-4">
            <NutritionLabel nutrition={nutrition} servings={current} />
          </div>
          <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-center gap-3 pt-2">
            <h2 className="font-headline-md text-headline-md uppercase">The Numbers</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-prose">
              {recipe.nutrition
                ? 'Per-serving nutrition for this recipe.'
                : 'Ballpark nutrition, worked out from the ingredient list. Treat it as a guide, not a doctor’s note.'}
            </p>
            <p className="font-label-mono text-label-mono text-on-surface-variant">
              Roughly {Math.round(nutrition.calories)} cal · {Math.round(nutrition.protein)}g protein ·
              {' '}{Math.round(nutrition.carbs)}g carbs · {Math.round(nutrition.fat)}g fat per serving.
            </p>
          </div>
        </section>
      )}

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
