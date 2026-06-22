import type { Nutrition } from '../lib/types'
import { DAILY_VALUES } from '../lib/nutrition'

// FDA-style Nutrition Facts panel. The black rules and heavy weights of the
// real label happen to be exactly the brand's brutalist vocabulary, so this
// reads as both "official" and on-theme. Values scale with the serving count.
export default function NutritionLabel({
  nutrition, servings,
}: { nutrition: Nutrition; servings: number }) {
  // Stored values are per-serving; they don't change when you scale the recipe,
  // so the panel always shows one serving. We surface the current count as context.
  const dv = (val: number | undefined, daily: number) =>
    val == null ? null : Math.round((val / daily) * 100)
  const round = (n?: number, d = 0) => (n == null ? 0 : Math.round(n * 10 ** d) / 10 ** d)

  const Row = ({
    label, value, unit, bold, indent, percent,
  }: { label: string; value?: number; unit: string; bold?: boolean; indent?: boolean; percent?: number | null }) => (
    <div className={`flex justify-between border-t border-on-background py-1 ${indent ? 'pl-4' : ''}`}>
      <span className="font-body-sm text-body-sm">
        <span className={bold ? 'font-bold' : ''}>{label}</span>{' '}
        {value != null && <span>{round(value, unit === 'g' && value < 10 ? 1 : 0)}{unit}</span>}
      </span>
      {percent != null && <span className="font-body-sm text-body-sm font-bold">{percent}%</span>}
    </div>
  )

  return (
    <div className="bg-surface brutal-border brutalist-offset p-4 max-w-sm">
      <h3 className="font-headline-md text-headline-md uppercase leading-none border-b-8 border-on-background pb-1">
        Nutrition Facts
      </h3>
      <div className="flex justify-between items-baseline border-b border-on-background py-1">
        <span className="font-label-mono text-label-mono">Per serving</span>
        <span className="font-label-mono text-label-mono text-on-surface-variant">
          recipe makes {round(servings)}
        </span>
      </div>

      <div className="flex justify-between items-end border-b-4 border-on-background py-1">
        <span className="font-headline-sm text-headline-sm uppercase">Calories</span>
        <span className="font-display-lg text-display-lg-mobile leading-none">{Math.round(nutrition.calories)}</span>
      </div>

      <div className="text-right font-label-caps text-label-caps uppercase border-b border-on-background py-1 text-on-surface-variant">
        % Daily Value*
      </div>

      <Row label="Total Fat" value={nutrition.fat} unit="g" bold percent={dv(nutrition.fat, DAILY_VALUES.fat)} />
      {nutrition.saturatedFat != null && (
        <Row label="Saturated Fat" value={nutrition.saturatedFat} unit="g" indent percent={dv(nutrition.saturatedFat, DAILY_VALUES.saturatedFat)} />
      )}
      <Row label="Sodium" value={nutrition.sodium} unit="mg" bold percent={dv(nutrition.sodium, DAILY_VALUES.sodium)} />
      <Row label="Total Carbohydrate" value={nutrition.carbs} unit="g" bold percent={dv(nutrition.carbs, DAILY_VALUES.carbs)} />
      {nutrition.fiber != null && (
        <Row label="Dietary Fiber" value={nutrition.fiber} unit="g" indent percent={dv(nutrition.fiber, DAILY_VALUES.fiber)} />
      )}
      {nutrition.sugar != null && (
        <Row label="Total Sugars" value={nutrition.sugar} unit="g" indent percent={null} />
      )}
      <Row label="Protein" value={nutrition.protein} unit="g" bold percent={dv(nutrition.protein, DAILY_VALUES.protein)} />

      <p className="font-label-mono text-[11px] leading-tight text-on-surface-variant mt-2 border-t-4 border-on-background pt-2">
        * Percent Daily Values are based on a 2,000 calorie diet.
        {nutrition.source === 'estimated' && ' Values estimated from ingredients — close, not gospel.'}
      </p>
    </div>
  )
}
