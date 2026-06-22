import { useCallback, useEffect, useRef, useState } from 'react'

// Hands-free cooking view: screen stays awake, one big step at a time, and an
// ingredient checklist you can tap off as you go. Opens as a full-screen modal
// over the recipe. Ingredients/steps are passed in already scaled + converted,
// so it always agrees with the controls on the page behind it.

// --- screen wake lock -----------------------------------------------------
// Minimal local typing so we don't depend on the runtime's lib.dom version.
interface WakeSentinel { release(): Promise<void>; addEventListener(t: 'release', cb: () => void): void }
interface WakeNavigator { wakeLock?: { request(type: 'screen'): Promise<WakeSentinel> } }

function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeSentinel | null>(null)
  const [held, setHeld] = useState(false)

  useEffect(() => {
    if (!active) return
    let cancelled = false
    const request = async () => {
      try {
        const nav = navigator as unknown as WakeNavigator
        const lock = await nav.wakeLock?.request('screen')
        if (cancelled || !lock) return
        lockRef.current = lock
        setHeld(true)
        lock.addEventListener('release', () => setHeld(false))
      } catch { setHeld(false) }
    }
    request()
    // Re-acquire after the tab is backgrounded (the OS auto-releases it).
    const onVisible = () => { if (document.visibilityState === 'visible') request() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      lockRef.current?.release().catch(() => {})
      lockRef.current = null
    }
  }, [active])

  return held
}

export default function CookingMode({
  name, ingredients, steps, onClose,
}: { name: string; ingredients: string[]; steps: string[]; onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [showIngredients, setShowIngredients] = useState(false) // mobile drawer
  const awake = useWakeLock(true)
  const last = steps.length - 1

  const next = useCallback(() => setStep((s) => Math.min(last, s + 1)), [last])
  const prev = useCallback(() => setStep((s) => Math.max(0, s - 1)), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, onClose])

  const toggle = (i: number) =>
    setChecked((c) => { const n = new Set(c); n.has(i) ? n.delete(i) : n.add(i); return n })

  const Ingredients = (
    <ul className="font-label-mono text-label-mono space-y-1">
      {ingredients.map((ing, i) => (
        <li key={i}>
          <button
            onClick={() => toggle(i)}
            className="tap w-full text-left flex items-start gap-3 py-2 border-b border-on-background/20 group"
          >
            <span className={`mt-0.5 w-5 h-5 shrink-0 border-2 border-on-background flex items-center justify-center ${checked.has(i) ? 'bg-primary' : 'bg-surface'}`}>
              {checked.has(i) && <span className="material-symbols-outlined text-on-primary text-[16px] leading-none">check</span>}
            </span>
            <span className={checked.has(i) ? 'line-through text-on-surface-variant' : ''}>{ing}</span>
          </button>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="fixed inset-0 z-modal bg-background flex flex-col pt-safe pb-safe">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 px-4 md:px-8 py-3 brutal-border-b bg-surface">
        <div className="min-w-0 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary shrink-0">skillet</span>
          <h2 className="font-headline-sm text-headline-sm uppercase truncate">{name}</h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            title={awake ? 'Screen will stay awake' : 'Screen may sleep'}
            className={`hidden sm:inline-flex items-center gap-1 font-label-caps text-label-caps uppercase px-2 py-1 border-2 border-on-background ${awake ? 'bg-primary-container text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}
          >
            <span className="material-symbols-outlined text-[16px]">{awake ? 'lightbulb' : 'light_off'}</span>
            {awake ? 'Awake' : 'Sleep'}
          </span>
          <button
            onClick={onClose}
            className="tap inline-flex items-center gap-1 bg-on-background text-background px-3 py-2 font-label-caps text-label-caps uppercase brutal-btn border-2 border-on-background"
          >
            <span className="material-symbols-outlined text-[18px]">close</span> Done
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12">
        {/* Ingredients rail (desktop) */}
        <aside className="hidden md:flex md:col-span-4 lg:col-span-3 flex-col brutal-border-b md:border-b-0 md:border-r-2 md:border-on-background bg-surface-container-low overflow-y-auto p-6">
          <h3 className="font-headline-sm text-headline-sm uppercase border-b-4 border-on-background pb-1 mb-3">Hardware</h3>
          {Ingredients}
        </aside>

        {/* Step stage */}
        <main className="md:col-span-8 lg:col-span-9 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8 flex flex-col justify-center">
            <div className="max-w-3xl mx-auto w-full">
              <div className="font-label-caps text-label-caps uppercase text-primary mb-4">
                Step {step + 1} of {steps.length}
              </div>
              <p className="font-display-lg text-3xl md:text-4xl lg:text-5xl leading-tight" style={{ textWrap: 'balance' }}>
                {steps[step]}
              </p>
            </div>
          </div>

          {/* Progress + controls */}
          <div>
            <div className="h-2 bg-surface-container">
              <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
            </div>
            <div className="flex items-stretch border-t-2 border-on-background">
              <button
                onClick={() => setShowIngredients(true)}
                className="tap md:hidden flex items-center justify-center gap-1 px-4 border-r-2 border-on-background bg-surface font-label-caps text-label-caps uppercase"
              >
                <span className="material-symbols-outlined">list_alt</span>
              </button>
              <button
                onClick={prev}
                disabled={step === 0}
                className="tap flex-1 flex items-center justify-center gap-2 py-5 bg-surface font-headline-sm text-headline-sm uppercase border-r-2 border-on-background disabled:opacity-30 hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                <span className="hidden sm:inline">Back</span>
              </button>
              {step === last ? (
                <button
                  onClick={onClose}
                  className="tap flex-1 flex items-center justify-center gap-2 py-5 bg-primary text-on-primary font-headline-sm text-headline-sm uppercase hover:opacity-90"
                >
                  <span className="material-symbols-outlined">restaurant</span> Eat
                </button>
              ) : (
                <button
                  onClick={next}
                  className="tap flex-[2] flex items-center justify-center gap-2 py-5 bg-primary-container text-on-primary font-headline-sm text-headline-sm uppercase hover:opacity-90"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Ingredients drawer (mobile) */}
      {showIngredients && (
        <div className="md:hidden fixed inset-0 z-modal flex flex-col" role="dialog">
          <button className="flex-1 bg-on-background/40" onClick={() => setShowIngredients(false)} aria-label="Close ingredients" />
          <div className="bg-surface border-t-2 border-on-background max-h-[70vh] overflow-y-auto p-6 pb-safe" style={{ animation: 'fadeIn .15s ease-out' }}>
            <div className="flex items-center justify-between mb-3 border-b-4 border-on-background pb-1">
              <h3 className="font-headline-sm text-headline-sm uppercase">Hardware</h3>
              <button onClick={() => setShowIngredients(false)} className="tap"><span className="material-symbols-outlined">close</span></button>
            </div>
            {Ingredients}
          </div>
        </div>
      )}
    </div>
  )
}
