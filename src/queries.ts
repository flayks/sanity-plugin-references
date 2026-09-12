import type {SanityClient} from 'sanity'

/**
 * Drafts and release versions are the same document, so incoming references
 * are always counted against the published id.
 */
export function getPublishedId(id: string): string {
  if (id.startsWith('drafts.')) return id.slice('drafts.'.length)
  // versions.<releaseId>.<publishedId>
  if (id.startsWith('versions.')) return id.split('.').slice(2).join('.')
  return id
}

/** Excludes drafts and release versions, which would show up as duplicates. */
export const PUBLISHED_ONLY = '!(_id in path("drafts.**")) && !(_id in path("versions.**"))'

/** Documents referencing the given published id. */
export const referencesFilter = `*[references($id) && ${PUBLISHED_ONLY}]`

/**
 * Watch every document referencing `id` and call back when one changes.
 * Debounced, because editing a referencing draft emits a burst of mutations.
 */
export function subscribeToReferences(client: SanityClient, id: string, onChange: () => void) {
  let timer: number | undefined

  const subscription = client.listen(/* groq */ `*[references($id)]`, {id}).subscribe(() => {
    window.clearTimeout(timer)
    timer = window.setTimeout(onChange, 500)
  })

  return () => {
    window.clearTimeout(timer)
    subscription.unsubscribe()
  }
}
