import {LinkIcon} from '@sanity/icons/Link'
import {SearchIcon} from '@sanity/icons/Search'
import {SortIcon} from '@sanity/icons/Sort'
import {
  Box,
  Card,
  Flex,
  Inline,
  Stack,
  Text,
  TextInput,
  Select,
  Spinner,
  Button,
  Badge,
  Radio,
} from '@sanity/ui'
import {useMemo, useState, useEffect, useCallback} from 'react'
import {useClient, useSchema, Preview} from 'sanity'
import {useRouter} from 'sanity/router'
import {type UserViewComponent} from 'sanity/structure'

import {getPublishedId, referencesFilter, subscribeToReferences} from './queries'

interface ReferencingDocument {
  _id: string
  _type: string
  _updatedAt: string
  title?: string
  [key: string]: unknown
}

const DOCUMENT_LIMIT = 200

// The whole document, so each schema type's own preview fields resolve
const referencingDocumentsQuery = /* groq */ `${referencesFilter} | order(_updatedAt desc) [0...${DOCUMENT_LIMIT}] {
  ...,
  "title": coalesce(title, name, "Untitled")
}`
const SORT_OPTIONS = ['updatedAt', 'type', 'title'] as const
type SortOption = (typeof SORT_OPTIONS)[number]

const toSortOption = (value: string): SortOption =>
  SORT_OPTIONS.find((option) => option === value) ?? 'updatedAt'

/**
 * Structure Builder view component that displays documents referencing the current document.
 * Use this component with S.view.component() in your structure configuration.
 *
 * @example
 * ```ts
 * import { references, referencesView } from 'sanity-plugin-references'
 * import { LinkIcon } from '@sanity/icons/Link'
 *
 * S.document().views([
 *   S.view.form(),
 *   referencesView(S),
 * ])
 * ```
 */
export const ReferencesPane: UserViewComponent = (props) => {
  const {documentId} = props
  const client = useClient({apiVersion: '2026-01-05'})
  const schema = useSchema()
  const router = useRouter()

  const [documents, setDocuments] = useState<ReferencingDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt')
  const [sortDesc, setSortDesc] = useState(true)

  const publishedId = useMemo(() => getPublishedId(documentId), [documentId])

  const fetchDocuments = useCallback(async () => {
    if (!publishedId) return
    setError(null)
    try {
      const results = await client.fetch<ReferencingDocument[]>(referencingDocumentsQuery, {
        id: publishedId,
      })
      setDocuments(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch references')
    } finally {
      setLoading(false)
    }
  }, [client, publishedId])

  useEffect(() => {
    // Loading the list is exactly the external-system sync an effect is for
    // oxlint-disable-next-line react/set-state-in-effect
    setLoading(true)
    void fetchDocuments()

    // Keep the list in sync while the tab is open
    return subscribeToReferences(client, publishedId, () => void fetchDocuments())
  }, [client, fetchDocuments, publishedId])

  const documentTypes = useMemo(
    () => [...new Set(documents.map((doc: ReferencingDocument) => doc._type))].sort(),
    [documents],
  )

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return documents
      .filter((doc: ReferencingDocument) => typeFilter === 'all' || doc._type === typeFilter)
      .filter(
        (doc: ReferencingDocument) =>
          !query ||
          doc.title?.toLowerCase().includes(query) ||
          doc._type.toLowerCase().includes(query),
      )
      .sort((a: ReferencingDocument, b: ReferencingDocument) => {
        const cmp =
          sortBy === 'updatedAt'
            ? new Date(a._updatedAt).getTime() - new Date(b._updatedAt).getTime()
            : sortBy === 'type'
              ? a._type.localeCompare(b._type)
              : (a.title || '').localeCompare(b.title || '')
        return sortDesc ? -cmp : cmp
      })
  }, [documents, typeFilter, searchQuery, sortBy, sortDesc])

  const getSchemaType = useCallback((type: string) => schema.get(type), [schema])

  if (loading) {
    return (
      <Flex align="center" justify="center" padding={5}>
        <Spinner muted />
      </Flex>
    )
  }

  if (error) {
    return (
      <Card padding={4} tone="critical">
        <Text>{error}</Text>
      </Card>
    )
  }

  if (documents.length === 0) {
    return (
      <Card padding={5}>
        <Flex align="center" justify="center" direction="column" gap={3}>
          <LinkIcon style={{fontSize: 32, opacity: 0.4}} />
          <Text muted>No documents reference this one</Text>
        </Flex>
      </Card>
    )
  }

  const useSelectForFilters = documentTypes.length >= 4

  return (
    <Flex direction="column" style={{height: '100%', overflow: 'hidden'}}>
      {/* Sticky Filters and Search */}
      <Box style={{flexShrink: 0}}>
        {/* Toolbar */}
        <Card borderBottom padding={2}>
          <Flex gap={2} align="center" wrap="nowrap">
            {useSelectForFilters ? (
              <Box style={{minWidth: 150, maxWidth: 250}}>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.currentTarget.value)}
                  fontSize={1}
                  padding={2}
                  style={{width: '100%'}}
                >
                  <option value="all">All types</option>
                  {documentTypes.map((type: string) => {
                    const schemaType = getSchemaType(type)
                    return (
                      <option key={type} value={type}>
                        {schemaType?.title || type}
                      </option>
                    )
                  })}
                </Select>
              </Box>
            ) : (
              <Inline gap={2} style={{flexShrink: 0}}>
                <Flex
                  align="center"
                  gap={1}
                  as="label"
                  style={{cursor: 'pointer', whiteSpace: 'nowrap'}}
                >
                  <Radio checked={typeFilter === 'all'} onChange={() => setTypeFilter('all')} />
                  <Text size={1} weight={typeFilter === 'all' ? 'semibold' : 'regular'}>
                    All
                  </Text>
                </Flex>
                {documentTypes.map((type: string) => {
                  const schemaType = getSchemaType(type)
                  return (
                    <Flex
                      key={type}
                      align="center"
                      gap={1}
                      as="label"
                      style={{cursor: 'pointer', whiteSpace: 'nowrap'}}
                    >
                      <Radio checked={typeFilter === type} onChange={() => setTypeFilter(type)} />
                      <Text size={1} weight={typeFilter === type ? 'semibold' : 'regular'}>
                        {schemaType?.title || type}
                      </Text>
                    </Flex>
                  )
                })}
              </Inline>
            )}
            <Box flex={1} />
            <Flex gap={1} style={{flexShrink: 0}}>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(toSortOption(e.currentTarget.value))}
                fontSize={1}
                padding={2}
              >
                <option value="updatedAt">Updated</option>
                <option value="type">Type</option>
                <option value="title">Title</option>
              </Select>
              <Button
                icon={SortIcon}
                mode="ghost"
                onClick={() => setSortDesc((d: boolean) => !d)}
                title={sortDesc ? 'Descending' : 'Ascending'}
                fontSize={1}
                padding={2}
              />
            </Flex>
          </Flex>
        </Card>

        {/* Count + Search */}
        <Card borderBottom paddingX={3} paddingY={0}>
          <Flex align="stretch" style={{minHeight: 33}}>
            <Flex align="center" paddingY={2} style={{flexShrink: 0}}>
              <Text size={1} muted>
                {filteredDocuments.length} of {documents.length} document
                {documents.length !== 1 ? 's' : ''}
                {documents.length === DOCUMENT_LIMIT ? ' (first ' + DOCUMENT_LIMIT + ')' : ''}
              </Text>
            </Flex>
            <Box
              style={{
                flex: 1,
                minWidth: 180,
                borderLeft: '1px solid var(--card-border-color)',
                paddingLeft: 4,
                marginLeft: 12,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <TextInput
                icon={SearchIcon}
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                fontSize={1}
                padding={2}
                border={false}
                style={{boxShadow: 'none', width: '100%'}}
              />
            </Box>
          </Flex>
        </Card>
      </Box>

      {/* Document list */}
      <Box style={{flex: 1, overflow: 'auto'}}>
        <Stack gap={1} padding={2}>
          {filteredDocuments.length === 0 ? (
            <Card padding={4}>
              <Text muted align="center">
                No documents match your filters
              </Text>
            </Card>
          ) : (
            filteredDocuments.map((doc: ReferencingDocument) => {
              const schemaType = getSchemaType(doc._type)
              return (
                <Card
                  key={doc._id}
                  as="button"
                  padding={1}
                  radius={2}
                  onClick={() => router.navigateIntent('edit', {id: doc._id, type: doc._type})}
                  style={{cursor: 'pointer', textAlign: 'left', width: '100%'}}
                >
                  <Flex gap={3} align="center">
                    <Box flex={1}>
                      {schemaType ? (
                        <Preview schemaType={schemaType} value={doc} layout="default" />
                      ) : (
                        <Text weight="medium">{doc.title}</Text>
                      )}
                    </Box>
                    <Badge tone="primary" fontSize={0}>
                      {schemaType?.title || doc._type}
                    </Badge>
                  </Flex>
                </Card>
              )
            })
          )}
        </Stack>
      </Box>
    </Flex>
  )
}
