import { useRef, useState } from 'react'
import type { AutomataMode, FAStateNode } from '../types/automata'

interface BottomControlsProps {
  mode: AutomataMode
  nodes: FAStateNode[]
  warnings: string[]
  onStart: (input: string) => void
  onStep: () => void
  onRun: () => void
  onReset: () => void
  onAddTransition: (from: string, to: string, symbols: string) => void
  onGeneratePatterns: (maxLength: number, alphabetRaw: string) => void
  onExport: () => string
  onImport: (raw: string) => { ok: boolean; error?: string }
}

function BottomControls({
  mode,
  nodes,
  warnings,
  onStart,
  onStep,
  onRun,
  onReset,
  onAddTransition,
  onGeneratePatterns,
  onExport,
  onImport,
}: BottomControlsProps) {
  const [input, setInput] = useState('')
  const [message, setMessage] = useState<string>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [symbols, setSymbols] = useState('')
  const [alphabet, setAlphabet] = useState('')
  const [maxLength, setMaxLength] = useState(4)
  const inputFileRef = useRef<HTMLInputElement>(null)

  const downloadJson = () => {
    const content = onExport()
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'automata.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = async (file: File) => {
    const raw = await file.text()
    const result = onImport(raw)
    setMessage(result.ok ? 'Automaton imported.' : `Import failed: ${result.error}`)
  }

  const addTransitionQuickly = () => {
    if (!from || !to || !symbols.trim()) {
      setMessage('Select source, destination, and symbols to add a transition.')
      return
    }

    onAddTransition(from, to, symbols)
    setSymbols('')
    setMessage('Transition added/updated.')
  }

  return (
    <footer className="bottom-controls panel">
      <div className="controls-main">
        <label htmlFor="inputString">Input String</label>
        <input
          id="inputString"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={mode === 'NFA' ? 'e.g. abba or use ε in transitions' : 'e.g. 0101'}
        />
        <button className="primary" onClick={() => onStart(input)}>
          Start + Output
        </button>
        <button onClick={onStep}>Step</button>
        <button onClick={onRun}>Run</button>
        <button onClick={onReset}>Reset</button>
      </div>

      <div className="controls-transition">
        <label>Quick Transition</label>
        <select value={from} onChange={(event) => setFrom(event.target.value)}>
          <option value="">From</option>
          {nodes.map((node) => (
            <option key={`from-${node.id}`} value={node.id}>
              {node.data.label} ({node.id})
            </option>
          ))}
        </select>
        <select value={to} onChange={(event) => setTo(event.target.value)}>
          <option value="">To</option>
          {nodes.map((node) => (
            <option key={`to-${node.id}`} value={node.id}>
              {node.data.label} ({node.id})
            </option>
          ))}
        </select>
        <input
          value={symbols}
          onChange={(event) => setSymbols(event.target.value)}
          placeholder="Symbols: a,b | 0 1 ; ε"
        />
        <button onClick={addTransitionQuickly}>Add Transition</button>
      </div>

      <div className="controls-secondary">
        <label>Pattern Output</label>
        <input
          value={alphabet}
          onChange={(event) => setAlphabet(event.target.value)}
          placeholder="Alphabet (optional): 0,1"
        />
        <input
          type="number"
          min={0}
          max={6}
          value={maxLength}
          onChange={(event) => setMaxLength(Number(event.target.value || 0))}
          title="Max length (capped at 6)"
        />
        <button onClick={() => onGeneratePatterns(maxLength, alphabet)}>
          Auto Generate Outputs
        </button>

        <button onClick={downloadJson}>Export JSON</button>
        <button onClick={() => inputFileRef.current?.click()}>Import JSON</button>
        <input
          ref={inputFileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              void handleImportFile(file)
            }
          }}
        />
        <p className="shortcut-hint">
          Shortcuts: Ctrl/Cmd+Z, Ctrl/Cmd+Y, Del. Symbols support comma/space/semicolon/pipe. Pattern max length is capped at 6 for speed.
        </p>
      </div>

      {(warnings.length > 0 || message) && (
        <div className="warnings-box">
          {warnings.map((warning, index) => (
            <p key={`${warning}-${index}`}>⚠ {warning}</p>
          ))}
          {message && <p>{message}</p>}
        </div>
      )}
    </footer>
  )
}

export default BottomControls
