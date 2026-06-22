import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { listCategories, getRecipeBySlug, uploadPhoto, saveRecipe, type GearInput } from '../lib/recipes'
import { slugify } from '../lib/slug'
import type { Category } from '../lib/types'

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
      setGear(r.gear.map((g) => ({ label: g.label, url: g.url, blurb: g.blurb ?? '' })))
    })
  }, [editSlug])

  function setAt<T>(list: T[], i: number, v: T) { const c = [...list]; c[i] = v; return c }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    try { setPhotoUrl(await uploadPhoto(file)) } catch (err) { setError(String(err)) }
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
          category_id: categoryId, photo_url: photoUrl },
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
