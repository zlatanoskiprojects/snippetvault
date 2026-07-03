const LANG_COLORS: Record<string, { bg: string; color: string }> = {
  TS:  { bg: '#0b152d', color: '#3d77fc' },
  PY:  { bg: '#062311', color: '#22c55e' },
  SH:  { bg: '#19102c', color: '#8c5af3' },
  SQL: { bg: '#2b0c0c', color: '#ef4444' },
  JS:  { bg: '#1f1200', color: '#fba528' },
}

interface LanguageBadgeProps {
  language: string
}

export default function LanguageBadge({ language }: LanguageBadgeProps) {
  const { bg, color } = LANG_COLORS[language] ?? { bg: '#1a1a1a', color: '#9ba3af' }
  return (
    <span
      className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
      style={{ backgroundColor: bg, color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-sm shrink-0"
        style={{ backgroundColor: color }}
      />
      {language}
    </span>
  )
}