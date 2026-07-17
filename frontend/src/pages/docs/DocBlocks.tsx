import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { cn } from '../../lib/utils'

interface DocHeadingProps {
  id: string
  level?: 2 | 3
  children: ReactNode
}

function scrollToHeading(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  window.history.replaceState(null, '', `#${id}`)
}

export function DocHeading({ id, level = 2, children }: DocHeadingProps) {
  const Tag = level === 2 ? 'h2' : 'h3'
  const sizeClasses = level === 2
    ? 'text-xl font-semibold text-white mt-10 mb-3 scroll-mt-6'
    : 'text-base font-semibold text-white mt-8 mb-2 scroll-mt-6'

  return (
    <Tag id={id} className={cn('group flex items-center gap-2', sizeClasses)}>
      <span>{children}</span>
      <a
        href={`#${id}`}
        onClick={e => { e.preventDefault(); scrollToHeading(id) }}
        aria-label="Link to this section"
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[#595e69] hover:text-[#6366f1] text-sm font-normal"
      >
        #
      </a>
    </Tag>
  )
}

export function DocParagraph({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-6 text-[#9ba3af] mb-4">{children}</p>
}

export function DocList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mb-4 space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm leading-6 text-[#9ba3af]">
          <span className="mt-2 h-1 w-1 rounded-full bg-[#6366f1] shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="font-mono text-[12px] text-white bg-[#222] border border-[#2a2a2a] rounded px-1.5 py-0.5">
      {children}
    </code>
  )
}

interface DocCodeBlockProps {
  code: string
  language?: string
  filename?: string
}

export function DocCodeBlock({ code, language, filename }: DocCodeBlockProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg overflow-hidden mb-4">
      <div className="flex items-center justify-between h-[40px] px-3 bg-[#121212] border-b border-[#2a2a2a]">
        <span className="text-xs text-[#595e69] font-medium">{filename || language || 'text'}</span>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          className="h-auto text-[11px] px-2.5 py-1 rounded"
        >
          ⎘ {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <pre className="p-4 font-mono text-[13px] leading-6 text-[#d4d4d8] overflow-x-auto">
        {code}
      </pre>
    </div>
  )
}

interface DocCalloutProps {
  variant: 'info' | 'warning'
  title?: string
  children: ReactNode
}

export function DocCallout({ variant, title, children }: DocCalloutProps) {
  const isInfo = variant === 'info'
  return (
    <div
      className={cn(
        'rounded-md border px-4 py-3 text-sm mb-4',
        isInfo ? 'bg-[#6366f1]/10 border-[#6366f1]/30 text-[#9ba3af]' : 'bg-[#fba528]/10 border-[#fba528]/30 text-[#9ba3af]'
      )}
    >
      {title && (
        <p className={cn('text-xs font-semibold mb-1', isInfo ? 'text-[#6366f1]' : 'text-[#fba528]')}>
          {title}
        </p>
      )}
      <div className="leading-6">{children}</div>
    </div>
  )
}

interface DocTableProps {
  headers: string[]
  rows: ReactNode[][]
}

export function DocTable({ headers, rows }: DocTableProps) {
  return (
    <div className="overflow-x-auto mb-4 border border-[#2a2a2a] rounded-lg">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#2a2a2a]">
            {headers.map(header => (
              <th key={header} className="text-[11px] uppercase tracking-wider text-[#595e69] py-2 px-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[#2a2a2a] last:border-0">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={cn('text-[13px] text-[#9ba3af] py-2 px-3', j === 0 && 'font-mono text-white')}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ComingSoon() {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 text-center py-16 px-6">
      <Badge label="Coming soon" textColor="#6366f1" bgColor="rgba(99,102,241,0.12)" />
      <p className="text-sm text-[#9ba3af] max-w-sm">This section is being written. Check back soon.</p>
    </Card>
  )
}

interface PrevNextEntry {
  slug: string
  title: string
}

interface PrevNextNavProps {
  prev: PrevNextEntry | null
  next: PrevNextEntry | null
}

export function PrevNextNav({ prev, next }: PrevNextNavProps) {
  if (!prev && !next) return null

  return (
    <div className="grid sm:grid-cols-2 gap-3 mt-12">
      {prev ? (
        <Link
          to={`/docs/${prev.slug}`}
          className="border border-[#2a2a2a] rounded-lg p-4 hover:border-[#6366f1] transition-colors duration-150"
        >
          <p className="text-[11px] text-[#595e69] mb-1">Previous</p>
          <p className="text-sm text-white truncate">{prev.title}</p>
        </Link>
      ) : <div />}
      {next ? (
        <Link
          to={`/docs/${next.slug}`}
          className="border border-[#2a2a2a] rounded-lg p-4 hover:border-[#6366f1] transition-colors duration-150 sm:text-right"
        >
          <p className="text-[11px] text-[#595e69] mb-1">Next</p>
          <p className="text-sm text-white truncate">{next.title}</p>
        </Link>
      ) : <div />}
    </div>
  )
}
