import Badge from './ui/Badge'

const LANG_COLORS: Record<string, { bg: string; color: string }> = {
  TS:   { bg: 'var(--color-language-ts-surface)', color: 'var(--color-language-ts)' },
  PY:   { bg: 'var(--color-language-py-surface)', color: 'var(--color-language-py)' },
  SH:   { bg: 'var(--color-language-sh-surface)', color: 'var(--color-language-sh)' },
  SQL:  { bg: 'var(--color-language-sql-surface)', color: 'var(--color-language-sql)' },
  JS:   { bg: 'var(--color-language-js-surface)', color: 'var(--color-language-js)' },
  JAVA: { bg: 'var(--color-language-java-surface)', color: 'var(--color-language-java)' },
  CPP:  { bg: 'var(--color-language-cpp-surface)', color: 'var(--color-language-cpp)' },
  GO:   { bg: 'var(--color-language-go-surface)', color: 'var(--color-language-go)' },
  RUST: { bg: 'var(--color-language-rust-surface)', color: 'var(--color-language-rust)' },
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
  java: 'JAVA',
  'c++': 'CPP',
  cpp: 'CPP',
  go: 'GO',
  golang: 'GO',
  rust: 'RUST',
  rs: 'RUST',
}

interface LanguageBadgeProps {
  language: string
}

export default function LanguageBadge({ language }: LanguageBadgeProps) {
  const key = LANG_ALIASES[language.trim().toLowerCase()]
  const { bg, color } = (key && LANG_COLORS[key]) || { bg: 'var(--color-surface)', color: 'var(--color-secondary)' }
  return <Badge label={language} bgColor={bg} textColor={color} dotColor={color} />
}
