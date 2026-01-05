<h2 align="center">
  🔗 References Plugin for Sanity 🔗
</h2>
<p align="center">
  See which documents reference the current document in your Sanity Studio.<br/>
  Displays a badge with the reference count and a custom pane with the full list.
</p>

## Features

- **Reference Badge**: Shows count of documents referencing the current document
- **References Tab**: Lists all referencing documents with:
  - 🔍 **Search** by title or document type
  - ⬇️ **Sorting** by updated date, type, or title (ascending/descending)
  - 📊 **Live Count** of filtered vs total documents
  - 🚀 **Click to Navigate** to any referencing document

## Installation

```sh
# npm
npm i sanity-plugin-references

# yarn
yarn add sanity-plugin-references

# pnpm
pnpm add sanity-plugin-references

# bun
bun add sanity-plugin-references
```

## Usage

### Basic Setup

```ts
import { defineConfig } from 'sanity'
import { references } from 'sanity-plugin-references'

export default defineConfig({
  plugins: [references()],
})
```

This adds a **reference count badge** to all documents showing how many other documents reference them.

### Adding the References Tab

Add a full References tab with search, filters, and sorting:

```ts
import { structureTool } from 'sanity/structure'
import { references, referencesView } from 'sanity-plugin-references'

export default defineConfig({
  plugins: [
    references(),
    structureTool({
      defaultDocumentNode: (S) => S.document().views([
        S.view.form(),
        referencesView(S),
      ]),
    }),
  ],
})
```

### Options

**Exclude document types** from showing the badge:

```ts
references({
  exclude: ['media.tag', 'sanity.imageAsset'],
})
```

**Customize the tab** title or icon:

```ts
referencesView(S, { title: 'Incoming Links', icon: SomeIcon })
```

**Show tab only for specific types** by checking `schemaType` in `defaultDocumentNode`.

## API

### `references(config?)`

Main plugin function. Adds reference badges to all documents.

- `exclude?: string[]` - Document types to exclude from showing the badge

### `referencesView(S, options?)`

Creates a References view for Structure Builder.

- `title?: string` - Tab title (default: `'References'`)
- `icon?: ComponentType` - Tab icon (default: `LinkIcon`)

### Components

- **`ReferencesPane`** - Raw component for `S.view.component()` (use `referencesView()` instead)
- **`ReferencesBadge`** - Badge component (automatically included via `references()` plugin)

## License

[MIT](LICENSE) © Félix Péault (Flayks)

## Develop & test

This plugin uses [@sanity/plugin-kit](https://github.com/sanity-io/plugin-kit)
with default configuration for build & watch scripts.

See [Testing a plugin in Sanity Studio](https://github.com/sanity-io/plugin-kit#testing-a-plugin-in-sanity-studio)
on how to run this plugin with hotreload in the studio.
