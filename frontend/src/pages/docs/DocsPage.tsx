import { Navigate, useParams } from 'react-router-dom'
import DocsLayout from './DocsLayout'
import { PrevNextNav } from './DocBlocks'
import { DOCS_FLAT } from './registry'
import { usePageMeta } from '../../hooks/usePageMeta'

export default function DocsPage() {
  const { slug } = useParams<{ slug: string }>()
  const index = DOCS_FLAT.findIndex(doc => doc.slug === slug)
  const page = index === -1 ? null : DOCS_FLAT[index]
  usePageMeta({
    title: page ? `${page.title} · Docs` : 'Docs',
    description: page?.description,
    path: page ? `/docs/${page.slug}` : undefined,
  })

  if (!page) {
    return <Navigate to="/docs/introduction" replace />
  }

  const prev = index > 0 ? DOCS_FLAT[index - 1] : null
  const next = index < DOCS_FLAT.length - 1 ? DOCS_FLAT[index + 1] : null
  const PageComponent = page.component

  return (
    <DocsLayout slug={page.slug} title={page.title} headings={page.headings}>
      <h1 className="text-2xl font-semibold text-primary">{page.title}</h1>
      <p className="text-sm text-secondary mt-1 mb-2">{page.description}</p>
      <PageComponent />
      <PrevNextNav prev={prev} next={next} />
    </DocsLayout>
  )
}
