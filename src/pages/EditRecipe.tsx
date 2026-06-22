import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { listCategories, getRecipeBySlug, uploadPhoto, saveRecipe, type GearInput } from '../lib/recipes'
import { slugify } from '../lib/slug'
import { parseServings } from '../lib/ingredients'
import { estimateNutrition, searchFoods, type FoodSearchRow } from '../lib/nutrition'
import type { Category, Nutrition } from '../lib/types'

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
  const [servings, setServings] = useState('')
  const [baseServings, setBaseServings] = useState('')
  const [prepTime, setPrepTime] = useState('')
  const [cookTime, setCookTime] = useState('')
  const [totalTime, setTotalTime] = useState('')
  const [notes, setNotes] = useState('')
  const [nutrition, setNutrition] = useState<Nutrition | null>(null)
  const [estimating, setEstimating] = useState(false)
  const [estimateInfo, setEstimateInfo] = useState<{ matched: number; unmatched: string[] } | null>(null)
  const [foodQuery, setFoodQuery] = useState('')
  const [foodResults, setFoodResults] = useState<FoodSearchRow[]>([])
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
      setServings(r.servings ?? ''); setBaseServings(r.base_servings ? String(r.base_servings) : '')
      setPrepTime(r.prep_time ?? ''); setCookTime(r.cook_time ?? ''); setTotalTime(r.total_time ?? '')
      setNotes(r.notes ?? ''); setNutrition(r.nutrition)
      setGear(r.gear.map((g) => ({ label: g.label, url: g.url, blurb: g.blurb ?? '' })))
    })
  }, [editSlug])

  function setAt<T>(list: T[], i: number, v: T) { const c = [...list]; c[i] = v; return c }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    try { setPhotoUrl(await uploadPhoto(file)) } catch (err) { setError(String(err)) }
  }

  async function autoEstimate() {
    const lines = ingredients.map((s) => s.trim()).filter(Boolean)
    const div = baseServings ? Number(baseServings) : parseServings(servings, 4)
    setEstimating(true); setError('')
    try {
      const est = await estimateNutrition(lines, div)
      if (est.matched === 0) {
        setError('Couldn’t match any ingredients to the USDA database. Fill it in by hand.')
        setEstimateInfo(null)
        return
      }
      setNutrition({ ...est.perServing, source: 'estimated' })
      setEstimateInfo({ matched: est.matched, unmatched: est.unmatched })
    } catch (err) {
      setError(String(err))
    } finally {
      setEstimating(false)
    }
  }

  async function runFoodSearch(q: string) {
    setFoodQuery(q)
    if (!q.trim()) { setFoodResults([]); return }
    try { setFoodResults(await searchFoods(q)) } catch { /* ignore search errors */ }
  }

  function setNutritionField(key: keyof Nutrition, value: string) {
    const num = value === '' ? undefined : Number(value)
    setNutrition((prev) => {
      const base: Nutrition = prev ?? { calories: 0, protein: 0, carbs: 0, fat: 0, source: 'manual' }
      return { ...base, [key]: num ?? 0, source: 'manual' }
    })
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
          category_id: categoryId, photo_url: photoUrl,
          servings: servings.trim() || null,
          base_servings: baseServings ? Number(baseServings) : null,
          prep_time: prepTime.trim() || null, cook_time: cookTime.trim() || null,
          total_time: totalTime.trim() || null, notes: notes.trim() || null,
          nutrition },
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
        <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-background uppercase break-words">{id ? 'Fix the Archive' : 'Add to the Archive'}</h1>
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
                  <button type="button" onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))} className="tap shrink-0 flex items-center justify-center text-on-background hover:text-error"><span className="material-symbols-outlined">close</span></button>
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
                  <button type="button" onClick={() => setSteps(steps.filter((_, j) => j !== i))} className="tap shrink-0 flex items-center justify-center text-on-background hover:text-error"><span className="material-symbols-outlined">close</span></button>
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
                    <button type="button" onClick={() => setGear(gear.filter((_, j) => j !== i))} className="tap shrink-0 flex items-center justify-center text-on-background hover:text-error"><span className="material-symbols-outlined">close</span></button>
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
              {!photoUrl && (
                <div className="z-10 flex flex-col items-center text-center p-4">
                  <span className="material-symbols-outlined text-4xl mb-2 text-on-background">add_a_photo</span>
                  <span className="font-label-mono text-label-mono block text-on-background bg-surface px-2 py-1 brutal-border">CLICK TO UPLOAD</span>
                </div>
              )}
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

          {/* Timing & servings */}
          <div className="flex flex-col gap-3 index-card p-4">
            <h2 className="font-headline-sm text-headline-sm uppercase">Details</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className={labelCaps} htmlFor="servings">Serves (text)</label>
                <input id="servings" value={servings} onChange={(e) => setServings(e.target.value)} className={brutalInput} placeholder="4–6 people" />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCaps} htmlFor="baseServings">Scale base (#)</label>
                <input id="baseServings" type="number" min="1" value={baseServings} onChange={(e) => setBaseServings(e.target.value)} className={brutalInput} placeholder="4" />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCaps} htmlFor="prep">Prep time</label>
                <input id="prep" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} className={brutalInput} placeholder="15 min" />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCaps} htmlFor="cook">Cook time</label>
                <input id="cook" value={cookTime} onChange={(e) => setCookTime(e.target.value)} className={brutalInput} placeholder="30 min" />
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <label className={labelCaps} htmlFor="total">Total time</label>
                <input id="total" value={totalTime} onChange={(e) => setTotalTime(e.target.value)} className={brutalInput} placeholder="45 min" />
              </div>
            </div>
            <p className="font-label-mono text-[11px] text-on-surface-variant leading-tight">“Scale base” is how many servings the ingredient amounts are written for — it powers the serving slider.</p>
          </div>

          {/* Nutrition */}
          <div className="flex flex-col gap-3 index-card p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-headline-sm text-headline-sm uppercase">Nutrition</h2>
              <button type="button" onClick={autoEstimate} disabled={estimating}
                className="tap font-label-caps text-label-caps uppercase border-2 border-on-background px-2 py-1 hover:bg-surface-container inline-flex items-center gap-1 brutal-btn disabled:opacity-50">
                <span className="material-symbols-outlined text-[16px]">{estimating ? 'progress_activity' : 'calculate'}</span>
                {estimating ? 'Matching…' : 'Estimate'}
              </button>
            </div>
            <p className="font-label-mono text-[11px] text-on-surface-variant">
              Per serving. “Estimate” matches each ingredient against the USDA food database; edit any value to override.
            </p>
            <div className="grid grid-cols-2 gap-3 font-label-mono text-label-mono">
              {([
                ['calories', 'Calories'], ['protein', 'Protein (g)'], ['carbs', 'Carbs (g)'], ['fat', 'Fat (g)'],
                ['saturatedFat', 'Sat. fat (g)'], ['fiber', 'Fiber (g)'], ['sugar', 'Sugar (g)'], ['sodium', 'Sodium (mg)'],
              ] as [keyof Nutrition, string][]).map(([key, label]) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className={labelCaps} htmlFor={`n-${key}`}>{label}</label>
                  <input id={`n-${key}`} type="number" min="0" step="any"
                    value={nutrition && nutrition[key] != null && key !== 'source' ? String(nutrition[key]) : ''}
                    onChange={(e) => setNutritionField(key, e.target.value)}
                    className={brutalInput} placeholder="—" />
                </div>
              ))}
            </div>

            {/* Match transparency */}
            {estimateInfo && (
              <div className="font-label-mono text-[11px] text-on-surface-variant border-t border-on-background pt-2">
                Matched {estimateInfo.matched} ingredient{estimateInfo.matched === 1 ? '' : 's'}.
                {estimateInfo.unmatched.length > 0 && (
                  <> Not counted: <span className="text-error">{estimateInfo.unmatched.join('; ')}</span>.</>
                )}
              </div>
            )}

            {/* Food database lookup (picker) */}
            <details className="border-t border-on-background pt-2">
              <summary className="font-label-caps text-label-caps uppercase cursor-pointer tap">Look up a food</summary>
              <input value={foodQuery} onChange={(e) => runFoodSearch(e.target.value)}
                className={`${brutalInput} mt-2`} placeholder="e.g. parmesan" />
              {foodResults.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1 max-h-48 overflow-y-auto font-label-mono text-[11px]">
                  {foodResults.map((f) => (
                    <li key={f.id} className="flex justify-between gap-2 border-b border-on-background/30 py-1">
                      <span className="truncate" title={f.name}>{f.name}</span>
                      <span className="shrink-0 text-on-surface-variant">{Math.round(f.kcal)} cal/100g</span>
                    </li>
                  ))}
                </ul>
              )}
            </details>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2 index-card p-4">
            <label className={labelCaps} htmlFor="notes">Kitchen scrawl (notes, optional)</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className={`${brutalInput} font-label-mono text-label-mono resize-none`} placeholder="Don't skip the resting step." />
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
