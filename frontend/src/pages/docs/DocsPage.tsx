import { Navigate, useParams } from 'react-router-dom'
import DocsLayout from './DocsLayout'
import { PrevNextNav } from './DocBlocks'
import { DOCS_FLAT } from './registry'

export default function DocsPage() {
  const { slug } = useParams<{ slug: string }>()
  const index = DOCS_FLAT.findIndex(page => page.slug === slug)

  if (index === -1) {
    return <Navigate to="/docs/introduction" replace />
  }

  const page = DOCS_FLAT[index]
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
