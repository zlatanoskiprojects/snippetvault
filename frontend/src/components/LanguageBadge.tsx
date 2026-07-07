import Badge from './ui/Badge'

const LANG_COLORS: Record<string, { bg: string; color: string }> = {
  TS:  { bg: '#0b152d', color: '#3d77fc' },
  PY:  { bg: '#062311', color: '#22c55e' },
  SH:  { bg: '#19102c', color: '#8c5af3' },
  SQL: { bg: '#2b0c0c', color: '#ef4444' },
  JS:  { bg: '#1f1200', color: '#fba528' },
}

const LANG_ALIASES: Record<string, string> = {
  ts: 'TS',
  typescript: 'TS',
  py: 'PY',
  python: 'PY',
  sh: 'SH',
  shell: 'SH',
  bash: 'SH',
  sql: 'SQL',
  js: 'JS',
  javascript: 'JS',
}

interface LanguageBadgeProps {
  language: string
}

export default function LanguageBadge({ language }: LanguageBadgeProps) {
  const key = LANG_ALIASES[language.trim().toLowerCase()]
  const { bg, color } = (key && LANG_COLORS[key]) || { bg: '#1a1a1a', color: '#9ba3af' }
  return <Badge label={language} bgColor={bg} textColor={color} dotColor={color} />
}
