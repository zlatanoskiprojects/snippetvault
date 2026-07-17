import type { ComponentType } from 'react'
import { ComingSoon } from './DocBlocks'
import Introduction, { INTRODUCTION_HEADINGS } from './content/Introduction'
import QuickStart, { QUICK_START_HEADINGS } from './content/QuickStart'
import Snippets, { SNIPPETS_HEADINGS } from './content/Snippets'
import Collections, { COLLECTIONS_HEADINGS } from './content/Collections'
import Tags, { TAGS_HEADINGS } from './content/Tags'
import VersionHistory, { VERSION_HISTORY_HEADINGS } from './content/VersionHistory'
import PublicSharing, { PUBLIC_SHARING_HEADINGS } from './content/PublicSharing'
import Comments, { COMMENTS_HEADINGS } from './content/Comments'
import Search, { SEARCH_HEADINGS } from './content/Search'
import ApiReference, { API_REFERENCE_HEADINGS } from './content/ApiReference'

export interface DocHeadingRef {
  id: string
  label: string
}

export interface DocPage {
  slug: string
  title: string
  description: string
  component: ComponentType
  headings: DocHeadingRef[]
  comingSoon?: boolean
}

export interface DocSection {
  label: string
  pages: DocPage[]
}

export const DOCS_SECTIONS: DocSection[] = [
  {
    label: 'Getting Started',
    pages: [
      {
        slug: 'introduction',
        title: 'Introduction',
        description: 'What SnippetVault is and how it fits together.',
        component: Introduction,
        headings: INTRODUCTION_HEADINGS,
      },
      {
        slug: 'quick-start',
        title: 'Quick Start',
        description: 'Run the database, backend, and frontend locally.',
        component: QuickStart,
        headings: QUICK_START_HEADINGS,
      },
    ],
  },
  {
    label: 'Core Features',
    pages: [
      { slug: 'snippets', title: 'Snippets', description: 'Creating, editing, and organizing code snippets.', component: Snippets, headings: SNIPPETS_HEADINGS },
      { slug: 'collections', title: 'Collections', description: 'Grouping snippets into collections.', component: Collections, headings: COLLECTIONS_HEADINGS },
      { slug: 'tags', title: 'Tags', description: 'Labeling snippets with global tags.', component: Tags, headings: TAGS_HEADINGS },
      { slug: 'version-history', title: 'Version History', description: 'Tracking and restoring snippet versions.', component: VersionHistory, headings: VERSION_HISTORY_HEADINGS },
      { slug: 'public-sharing', title: 'Public Sharing', description: 'Sharing a snippet publicly via a share link.', component: PublicSharing, headings: PUBLIC_SHARING_HEADINGS },
      { slug: 'comments', title: 'Comments', description: 'Discussing snippets with comments.', component: Comments, headings: COMMENTS_HEADINGS },
      { slug: 'search', title: 'Search', description: 'Finding snippets across your vault.', component: Search, headings: SEARCH_HEADINGS },
    ],
  },
  {
    label: 'API Reference',
    pages: [
      { slug: 'api-reference', title: 'API Reference', description: 'REST endpoints exposed by the backend.', component: ApiReference, headings: API_REFERENCE_HEADINGS },
    ],
  },
  {
    label: 'Advanced',
    pages: [
      { slug: 'ai-assistant', title: 'AI Assistant', description: 'Configuring an AI provider for snippet assistance.', component: ComingSoon, headings: [], comingSoon: true },
      { slug: 'self-hosting', title: 'Self-Hosting', description: 'Deploying SnippetVault to your own infrastructure.', component: ComingSoon, headings: [], comingSoon: true },
      { slug: 'oauth-providers', title: 'OAuth Providers', description: 'Setting up Google and GitHub sign-in.', component: ComingSoon, headings: [], comingSoon: true },
    ],
  },
]

export const DOCS_FLAT: DocPage[] = DOCS_SECTIONS.flatMap(section => section.pages)
