import { useState, useEffect } from 'react'
import { type DocumentBadgeComponent, useClient } from 'sanity'

/**
 * Badge component that displays the count of documents referencing the current document
 */
export const ReferencesBadge: DocumentBadgeComponent = (props) => {
    const { id, published, draft } = props
    const documentId = published?._id || draft?._id || id
    const [count, setCount] = useState<number | null>(null)

    const client = useClient({ apiVersion: '2026-01-05' })

    useEffect(() => {
        if (!documentId) return

        const cleanId = documentId.replace(/^drafts\./, '')

        // Get count of documents referencing this document
        client.fetch<number>(
            /* groq */`count(*[references($id) && !(_id in path("drafts.**"))])`,
            { id: cleanId }
        ).then(setCount)

        // Subscribe to changes
        const subscription = client.listen(
            /* groq */`*[references($id)]`,
            { id: cleanId }
        ).subscribe(() => {
            client.fetch<number>(
                /* groq */`count(*[references($id) && !(_id in path("drafts.**"))])`,
                { id: cleanId }
            ).then(setCount)
        })

        return () => subscription.unsubscribe()
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
