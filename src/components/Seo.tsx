import { useEffect } from 'react'
import { applySeo, type SeoInput } from '../lib/seo'

// Declarative head management. Drop <Seo title=... /> into any page; it sets the
// document title, meta description, Open Graph / Twitter tags, and (optionally)
// a schema.org JSON-LD block, cleaning the JSON-LD up on unmount.
export default function Seo(props: SeoInput) {
  useEffect(() => applySeo(props), [
    props.title, props.description, props.image, props.type, JSON.stringify(props.jsonLd),
  ])
  return null
}
