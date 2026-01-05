import { definePlugin } from 'sanity'
import type { StructureBuilder } from 'sanity/structure'
import { LinkIcon } from '@sanity/icons'
import type { ComponentType } from 'react'
import { ReferencesBadge } from './badge'
import { ReferencesPane } from './pane'

interface ReferencesConfig {
    /**
     * Document types to exclude from showing the References badge
     * @example ['media.tag', 'sanity.imageAsset']
     */
    exclude?: string[]
}

/**
 * Plugin that shows documents referencing the current document.
 * Displays a badge with the reference count.
 *
 * To add the References tab to your documents, use the Structure Builder API
 * with the exported `ReferencesPane` component.
 *
 * @example Basic usage (badge only)
 * ```ts
 * // sanity.config.ts
 * import { references } from 'sanity-plugin-references'
 *
 * export default defineConfig({
 *   plugins: [references()],
 * })
 * ```
 *
 * @example Exclude specific document types from showing the badge
 * ```ts
 * references({ exclude: ['media.tag', 'sanity.imageAsset'] })
 * ```
 *
 * @example Adding the References tab with Structure Builder
 * ```ts
 * // sanity.config.ts
 * import { structureTool } from 'sanity/structure'
 * import { references, ReferencesPane } from 'sanity-plugin-references'
 * import { LinkIcon } from '@sanity/icons'
 *
 * export default defineConfig({
 *   plugins: [
 *     references(),
 *     structureTool({
 *       defaultDocumentNode: (S, { schemaType }) => {
 *         return S.document().views([
 *           S.view.form(),
 *           S.view.component(ReferencesPane).title('References').icon(LinkIcon),
 *         ])
 *       },
 *     }),
 *   ],
 * })
 * ```
 *
 * @example Using the referencesView helper
 * ```ts
 * import { references, referencesView } from 'sanity-plugin-references'
 *
 * structureTool({
 *   defaultDocumentNode: (S) => S.document().views([
 *     S.view.form(),
 *     referencesView(S),
 *   ]),
 * })
 * ```
 */
export const references = definePlugin<ReferencesConfig | void>((config) => {
    const excludeTypes = config?.exclude || []

    return {
        name: 'references',
        document: {
            badges: (prev, context) => {
                // Don't show badge for excluded types
                if (excludeTypes.includes(context.schemaType)) {
                    return prev
                }
                return [...prev, ReferencesBadge]
            },
        },
    }
})

export type { ReferencesConfig }


/**
 * Helper to create a References view for Structure Builder.
 *
 * @example
 * ```ts
 * S.document().views([
 *   S.view.form(),
 *   referencesView(S),
 * ])
 * ```
 *
 * @example With custom title and icon
 * ```ts
 * referencesView(S, { title: 'Incoming Links', icon: MyIcon })
 * ```
 */
export function referencesView(S: StructureBuilder, options?: {
    title?: string
    icon?: ComponentType
}) {
    return S.view
        .component(ReferencesPane)
        .title(options?.title || 'References')
        .icon(options?.icon || LinkIcon)
}

export { ReferencesPane } from './pane'
export { ReferencesBadge } from './badge'
export { LinkIcon as ReferencesIcon } from '@sanity/icons'
