import { useRef, useEffect } from 'react'

export default function CodeEditor({ language, code, onChange }) {
  const textareaRef = useRef(null)
  const lines = code.split('\n')

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = ta.scrollHeight + 'px'
  }, [code])

  function handleCopy() {
    navigator.clipboard.writeText(code)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <p className="text-xs text-[#9ba3af] mb-2">Code</p>
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

        <div className="flex flex-1 overflow-auto">
          <div className="flex flex-col items-end pr-3 pt-2 select-none w-[42px] shrink-0">
            {lines.map((_, i) => (
              <span key={i} className="text-[11px] text-[#595e69] leading-[20px]">
                {i + 1}
              </span>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            value={code}
            onChange={e => onChange(e.target.value)}
            placeholder="// Start typing your code here..."
            spellCheck={false}
            className="flex-1 bg-transparent resize-none overflow-hidden outline-none text-sm text-white font-mono leading-[20px] pt-2 pr-4 pl-2 placeholder-[#668066] min-w-0"
          />
        </div>
      </div>
    </div>
  )
}
