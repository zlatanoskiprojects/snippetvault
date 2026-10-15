import { useEffect } from 'react'

const SITE_NAME = 'SnippetVault'
const SITE_DESCRIPTION = 'SnippetVault is a secure code snippet manager for organizing, tagging, versioning, commenting on, and sharing reusable code.'

interface PageMeta {
  title?: string
  description?: string
  path?: string
  noindex?: boolean
}

function setHeadTag(selector: string, create: () => HTMLElement, attribute: string, value: string | null) {
  let element = document.head.querySelector<HTMLElement>(selector)
  if (value === null) {
    element?.remove()
    return
  }
  if (!element) {
    element = create()
    document.head.appendChild(element)
  }
  element.setAttribute(attribute, value)
}

function setMeta(key: 'name' | 'property', name: string, content: string | null) {
  setHeadTag(`meta[${key}="${name}"]`, () => {
    const meta = document.createElement('meta')
    meta.setAttribute(key, name)
    return meta
  }, 'content', content)
}

export function usePageMeta({ title, description = SITE_DESCRIPTION, path, noindex = false }: PageMeta) {
  useEffect(() => {
    const fullTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME
    const url = path === undefined ? null : new URL(path, window.location.origin).href

    document.title = fullTitle
    setMeta('name', 'description', description)
    setMeta('name', 'robots', noindex ? 'noindex' : null)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', description)
    setHeadTag('link[rel="canonical"]', () => {
      const link = document.createElement('link')
      link.rel = 'canonical'
      return link
    }, 'href', url)
  }, [title, description, path, noindex])
}
