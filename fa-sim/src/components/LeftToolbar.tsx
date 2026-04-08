import {
  Circle,
  Link2,
  MousePointer2,
  Flag,
  Disc3,
  Pencil,
  Trash2,
  Moon,
  Sun,
  Grid3x3,
  Undo2,
  Redo2,
} from 'lucide-react'
import type { AutomataMode, ToolType } from '../types/automata'

interface LeftToolbarProps {
  activeTool: ToolType
  mode: AutomataMode
  darkMode: boolean
  snapToGrid: boolean
  onToolChange: (tool: ToolType) => void
  onModeChange: (mode: AutomataMode) => void
  onToggleDarkMode: () => void
  onToggleSnap: () => void
  onUndo: () => void
  onRedo: () => void
}

const tools: Array<{ id: ToolType; label: string; icon: typeof MousePointer2 }> = [
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'add-state', label: 'Add State', icon: Circle },
  { id: 'add-transition', label: 'Transition', icon: Link2 },
  { id: 'toggle-initial', label: 'Toggle Initial', icon: Flag },
  { id: 'toggle-final', label: 'Toggle Final', icon: Disc3 },
  { id: 'edit-label', label: 'Edit Labels', icon: Pencil },
  { id: 'delete', label: 'Delete', icon: Trash2 },
]

function LeftToolbar({
  activeTool,
  mode,
  darkMode,
  snapToGrid,
  onToolChange,
  onModeChange,
  onToggleDarkMode,
  onToggleSnap,
  onUndo,
  onRedo,
}: LeftToolbarProps) {
  return (
    <aside className="left-sidebar panel">
      <h2>Tools</h2>
      <div className="tool-list">
        {tools.map((tool) => {
          const Icon = tool.icon
          return (
            <button
              key={tool.id}
              className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`}
              onClick={() => onToolChange(tool.id)}
            >
              <Icon size={20} strokeWidth={2.25} />
              <span>{tool.label}</span>
            </button>
          )
        })}
      </div>

      <h3>Mode</h3>
      <div className="segment">
        <button
          className={mode === 'DFA' ? 'active' : ''}
          onClick={() => onModeChange('DFA')}
        >
          DFA
        </button>
        <button
          className={mode === 'NFA' ? 'active' : ''}
          onClick={() => onModeChange('NFA')}
        >
          NFA
        </button>
      </div>

      <h3>Quick Actions</h3>
      <div className="quick-actions">
        <button className="secondary-btn" onClick={onUndo}>
          <Undo2 size={18} /> Undo
        </button>
        <button className="secondary-btn" onClick={onRedo}>
          <Redo2 size={18} /> Redo
        </button>
        <button className="secondary-btn" onClick={onToggleSnap}>
          <Grid3x3 size={18} /> {snapToGrid ? 'Snap: On' : 'Snap: Off'}
        </button>
        <button className="secondary-btn" onClick={onToggleDarkMode}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />} {darkMode ? 'Light' : 'Dark'}
        </button>
      </div>
    </aside>
  )
}

export default LeftToolbar
