import {useState, useEffect} from 'react'
import {type DocumentBadgeComponent, useClient} from 'sanity'

import {getPublishedId, referencesFilter, subscribeToReferences} from './queries'

const countQuery = /* groq */ `count(${referencesFilter})`

/**
 * Badge component that displays the count of documents referencing the current document
 */
export const ReferencesBadge: DocumentBadgeComponent = (props) => {
  const {id, published, draft} = props
  const documentId = published?._id || draft?._id || id
  const [count, setCount] = useState<number | null>(null)

  const client = useClient({apiVersion: '2026-01-05'})

  useEffect(() => {
    if (!documentId) return undefined

    let cancelled = false
    const publishedId = getPublishedId(documentId)

    const fetchCount = async () => {
      const next = await client.fetch<number>(countQuery, {id: publishedId})
      if (!cancelled) setCount(next)
    }

    void fetchCount()

    // Keep the count in sync while the document is open
    const unsubscribe = subscribeToReferences(client, publishedId, () => void fetchCount())

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [documentId, client])

  // Don't show badge if no references or still loading
  if (count === null || count === 0) {
    return null
  }

  return {
    label: `${count} reference${count > 1 ? 's' : ''}`,
    title: `${count} document${count > 1 ? 's' : ''} reference this. See "References" tab.`,
    color: 'primary',
  }
}
