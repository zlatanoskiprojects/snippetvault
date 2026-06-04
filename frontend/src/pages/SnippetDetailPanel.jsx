import { useState, useEffect } from 'react'
import LanguageBadge from '../components/LanguageBadge'
import TagPill from '../components/TagPill'
import CodeEditor from '../components/CodeEditor'
import VersionHistoryPanel from '../components/VersionHistoryPanel'

const LANG_NAMES = {
  TS: 'TypeScript',
  JS: 'JavaScript',
  PY: 'Python',
  SH: 'Shell',
  SQL: 'SQL',
}

export default function SnippetDetailPanel({ snippet, onClose, onEdit, onDelete, onRestore }) {
  const [copied, setCopied] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleCopy() {
    navigator.clipboard.writeText(snippet.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (showHistory) {
    return (
      <VersionHistoryPanel
        snippet={snippet}
        language={snippet.language}
        onBack={() => setShowHistory(false)}
        onRestore={updated => {
          setShowHistory(false)
          onRestore(updated)
        }}
      />
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#101010]">
      <div className="flex items-center justify-between px-4 h-[56px] bg-[#121212] border-b border-[#2a2a2a] shrink-0">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden text-[#9ba3af] hover:text-white transition-colors duration-150 text-sm mr-1"
            onClick={onClose}
          >
            ←
          </button>
          <span className="text-[13px] font-medium text-[#9ba3af]">Editor 1</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-[#222] border border-[#2a2a2a] rounded-md text-xs text-white px-3 h-[28px] flex items-center gap-1 select-none">
            {LANG_NAMES[snippet.language] ?? snippet.language}
            <span className="text-[#9ba3af]">∨</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="hidden lg:flex items-center justify-center w-[28px] h-[28px] rounded-md text-[#9ba3af] hover:text-white hover:bg-white/5 transition-colors duration-150"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="px-5 pt-4 pb-3 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold text-white leading-tight min-w-0 truncate">
            {snippet.title}
          </h2>
          <div className="shrink-0">
            <LanguageBadge language={snippet.language} />
          </div>
        </div>

        <span className="inline-flex items-center gap-1 bg-[#1a3d1a] text-[#22c55e] text-[10px] px-2 h-[22px] rounded mt-2">
          <span>●</span>
          Public
        </span>

        <p className="text-[13px] text-[#595e69] mt-2 leading-relaxed">{snippet.description}</p>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {(snippet.tags || []).map((tag) => (
            <TagPill key={tag} label={tag} />
          ))}
        </div>

        <div className="border-t border-[#2a2a2a] mt-4" />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden mx-3 my-3 min-h-0">
        <CodeEditor language={snippet.language} code={snippet.code} editable={false} label={null} />
      </div>

      <div className="flex items-center justify-between px-5 h-[56px] border-t border-[#2a2a2a] shrink-0 bg-[#101010]">
        <div className="flex items-center gap-2">
          <button
            className="bg-[#6366f1] hover:bg-indigo-500 text-white text-[13px] font-medium px-4 h-[34px] rounded-md flex items-center gap-1.5 transition-colors duration-150"
            onClick={() => onEdit(snippet)}
          >
            ✏ Edit
          </button>
          <button
            className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#9ba3af] hover:text-white hover:bg-[#222] text-[13px] font-medium px-4 h-[34px] rounded-md flex items-center gap-1.5 transition-colors duration-150"
            onClick={() => setShowHistory(true)}
          >
            ⏱ History
          </button>
          <button
            className="bg-[#331212] hover:bg-[#3d1515] text-[#ef4444] text-[13px] font-medium px-4 h-[34px] rounded-md flex items-center gap-1.5 transition-colors duration-150"
            onClick={() => onDelete(snippet.id)}
          >
            🗑 Delete
          </button>
        </div>

        <button
          className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#9ba3af] hover:text-white hover:bg-[#222] text-[13px] font-medium px-4 h-[34px] rounded-md flex items-center gap-1.5 transition-colors duration-150"
          onClick={handleCopy}
        >
          ⎘ {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}