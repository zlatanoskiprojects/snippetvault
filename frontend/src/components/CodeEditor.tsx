import { useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import CodeMirror from '@uiw/react-codemirror'
import type { Extension } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { sql } from '@codemirror/lang-sql'
import { cpp } from '@codemirror/lang-cpp'
import { java } from '@codemirror/lang-java'
import { rust } from '@codemirror/lang-rust'
import { go } from '@codemirror/lang-go'
import { oneDark } from '@codemirror/theme-one-dark'
import Button from './ui/Button'

const LANG_MAP: Record<string, Extension> = {
  javascript: javascript(),
  typescript: javascript({ typescript: true }),
  python: python(),
  css: css(),
  html: html(),
  sql: sql(),
  'c++': cpp(),
  java: java(),
  rust: rust(),
  go: go(),
}

interface CodeEditorProps {
  language?: string | null
  code: string
  onChange?: (value: string) => void
  editable?: boolean
  label?: string | null
}

export default function CodeEditor({ language, code, onChange, editable = true, label = 'Code' }: CodeEditorProps) {
  const [copied, setCopied] = useState(false)

  const extensions = useMemo(() => {
    const ext = LANG_MAP[(language || '').toLowerCase()]
    return ext ? [ext] : []
  }, [language])

  function handleCopy() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code)
    } else {
      const el = document.createElement('textarea')
      el.value = code
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {label && <p className="text-xs text-secondary mb-2">{label}</p>}
      <div className="flex flex-col bg-editor rounded-lg overflow-hidden flex-1 min-h-[300px]">
        <div className="flex items-center justify-between px-3 h-[40px] bg-panel-header border-b border-border-default shrink-0">
          <span className="text-xs text-muted font-medium">{language || 'TypeScript'}</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied!' : 'Copy'}
          </Button>
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
