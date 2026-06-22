import type { Recipe } from '../lib/types'

const FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#e3e2df"/><text x="50%" y="50%" font-family="Courier" font-size="20" fill="#8e706d" text-anchor="middle">NO PHOTO YET</text></svg>`,
)

export default function RecipeCard({ recipe, categoryLabel }: { recipe: Recipe; categoryLabel?: string }) {
  return (
    <a href={`#/recipe/${recipe.slug}`} className="bg-surface brutal-border flex flex-col relative group hover:-translate-y-1 transition-transform brutal-shadow block">
      {categoryLabel && (
        <div className="absolute top-0 right-4 bg-primary text-on-primary font-label-caps text-[10px] px-2 py-1 brutal-border border-t-0 z-10 uppercase">
          {categoryLabel}
        </div>
      )}
      <div className="h-48 brutal-border-b bg-surface-container-lowest overflow-hidden">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter contrast-125 saturate-[0.85]"
          src={recipe.photo_url || FALLBACK}
          alt={recipe.name}
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-headline-sm text-headline-sm text-on-background uppercase leading-tight mb-2">{recipe.name}</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-4 flex-grow">
          {recipe.tagline || recipe.summary || 'No notes. Just make it.'}
        </p>
        <span className="font-label-mono text-label-mono text-primary flex items-center gap-1 group-hover:underline underline-offset-4 decoration-2">
          READ MORE <span className="material-symbols-outlined text-[16px]">arrow_right_alt</span>
        </span>
      </div>
    </a>
  )
}
