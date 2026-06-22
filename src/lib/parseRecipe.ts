export function splitIngredients(block: string): string[] {
  return (block ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
}

export function splitSteps(block: string): string[] {
  return (block ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^\d+[.)]\s*/, ''))
    .filter(Boolean)
}

export function parseTags(raw: string): string[] {
  return (raw ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}
