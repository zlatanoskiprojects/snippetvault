import { useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { sql } from '@codemirror/lang-sql'
import { oneDark } from '@codemirror/theme-one-dark'

const LANG_MAP = {
  javascript: javascript(),
  js: javascript(),
  typescript: javascript({ typescript: true }),
  ts: javascript({ typescript: true }),
  python: python(),
  py: python(),
  css: css(),
  html: html(),
  sql: sql(),
}

export default function CodeEditor({ language, code, onChange, editable = true, label = 'Code' }) {
  const extensions = useMemo(() => {
    const ext = LANG_MAP[(language || '').toLowerCase()]
    return ext ? [ext] : []
  }, [language])

  function handleCopy() {
    navigator.clipboard.writeText(code)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {label && <p className="text-xs text-[#9ba3af] mb-2">{label}</p>}
      <div className="flex flex-col bg-[#0d0d0d] rounded-lg overflow-hidden flex-1 min-h-[300px]">
        <div className="flex items-center justify-between px-3 h-[40px] bg-[#121212] border-b border-[#2a2a2a] shrink-0">
          <span className="text-xs text-[#595e69] font-medium">{language || 'TypeScript'}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#9ba3af] text-[11px] px-2.5 py-1 rounded"
          >
            ⎘ Copy
          </button>
        </div>

        <CodeMirror
          value={code}
          onChange={onChange}
          extensions={extensions}
          theme={oneDark}
          editable={editable}
          basicSetup={{
            lineNumbers: true,
            bracketMatching: true,
            closeBrackets: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            highlightActiveLine: editable,
            foldGutter: false,
          }}
          style={{ fontSize: 13, flex: 1 }}
        />
      </div>
    </div>
  )
}