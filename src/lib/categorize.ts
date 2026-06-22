const RULES: Array<[RegExp, string]> = [
  [/cookie|candy|fudge|brittle|truffle|bonbon|confection|bar$/i, 'cookies-candy'],
  [/cake|pie|dessert|pastry|tart|pudding|custard|ice cream|frosting|sweet/i, 'desserts'],
  [/soup|stew|chowder|chili|broth|bisque/i, 'soups-stews'],
  [/pasta|spaghetti|lasagna|ravioli|gnocchi|risotto|italian|marinara/i, 'pasta-italian'],
  [/bread|roll|biscuit|muffin|loaf|focaccia|bun|bagel|scone/i, 'breads'],
  [/sauce|dressing|condiment|marinade|rub|jam|jelly|pickle|relish|gravy/i, 'sauces-condiments'],
  [/appetizer|dip|snack|finger food|hors|starter/i, 'appetizers-snacks'],
  [/side dish|side$|salad|vegetable|potato|rice/i, 'sides'],
  [/chicken|beef|pork|fish|seafood|casserole|main|dinner|entree|roast|meatball|lamb|turkey/i, 'mains'],
]

export function categorySlugForTags(tags: string[]): string {
  const hay = tags.join(' | ').toLowerCase()
  for (const [re, slug] of RULES) {
    if (re.test(hay)) return slug
  }
  return 'everything-else'
}
