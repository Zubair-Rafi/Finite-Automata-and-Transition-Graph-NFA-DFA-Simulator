import { useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import AutomataCanvas from './components/AutomataCanvas'
import BottomControls from './components/BottomControls'
import LeftToolbar from './components/LeftToolbar'
import RightTracePanel from './components/RightTracePanel'
import { useAutomataStore } from './store/useAutomataStore'

function App() {
  const {
    mode,
    tool,
    darkMode,
    snapToGrid,
    nodes,
    edges,
    simulation,
    outputPatternReport,
    outputPatternMessage,
    warnings,
    selectedTransitionSource,
    setMode,
    setTool,
    toggleDarkMode,
    toggleSnapToGrid,
    onNodesChange,
    onEdgesChange,
    addState,
    deleteNodeById,
    deleteEdgeById,
    toggleInitial,
    toggleFinal,
    editStateLabel,
    addTransition,
    editTransitionLabel,
    beginTransition,
    clearTransitionDraft,
    deleteSelected,
    startAndRunSimulation,
    generateOutputPatterns,
    stepSimulation,
    runSimulation,
    resetSimulation,
    exportJson,
    importJson,
    undo,
    redo,
  } = useAutomataStore()

  useEffect(() => {
    document.body.dataset.theme = darkMode ? 'dark' : 'light'
  }, [darkMode])

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const withCmd = event.ctrlKey || event.metaKey

      if (withCmd && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        undo()
      }

      if (withCmd && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        redo()
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        deleteSelected()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [deleteSelected, redo, undo])

  const handleNodeToolAction = (nodeId: string) => {
    switch (tool) {
      case 'add-transition': {
        if (!selectedTransitionSource) {
          beginTransition(nodeId)
          return
        }

        const raw = window.prompt(
          'Enter symbols (comma, space, semicolon, or pipe separated; use ε for epsilon):',
          'a,b',
        )
        if (raw) {
          addTransition(selectedTransitionSource, nodeId, raw)
        } else {
          clearTransitionDraft()
        }
        return
      }
      case 'toggle-initial':
        toggleInitial(nodeId)
        return
      case 'toggle-final':
        toggleFinal(nodeId)
        return
      case 'edit-label': {
        const node = nodes.find((state) => state.id === nodeId)
        const value = window.prompt('Edit state label:', node?.data.label ?? '')
        if (value) {
          editStateLabel(nodeId, value)
        }
        return
      }
      case 'delete':
        deleteNodeById(nodeId)
        return
      default:
        return
    }
  }

  const handleConnectTransition = (from: string, to: string) => {
    const raw = window.prompt(
      `Transition ${from} -> ${to}: enter symbols (comma, space, semicolon, or pipe separated):`,
      'a,b',
    )

    if (raw) {
      addTransition(from, to, raw)
    }
  }

  const handleEdgeToolAction = (edgeId: string) => {
    switch (tool) {
      case 'edit-label': {
        const edge = edges.find((transition) => transition.id === edgeId)
        const value = window.prompt(
          'Edit transition symbols (comma-separated):',
          edge?.data?.symbols.join(',') ?? '',
        )
        if (value) {
          editTransitionLabel(edgeId, value)
        }
        return
      }
      case 'delete':
        deleteEdgeById(edgeId)
        return
      default:
        return
    }
  }

  return (
    <ReactFlowProvider>
      <div className={`app-shell ${darkMode ? 'theme-dark' : 'theme-light'}`}>
        <LeftToolbar
          activeTool={tool}
          mode={mode}
          darkMode={darkMode}
          snapToGrid={snapToGrid}
          onToolChange={setTool}
          onModeChange={setMode}
          onToggleDarkMode={toggleDarkMode}
          onToggleSnap={toggleSnapToGrid}
          onUndo={undo}
          onRedo={redo}
        />

        <main className="main-zone">
          <AutomataCanvas
            nodes={nodes}
            edges={edges}
            activeTool={tool}
            snapToGrid={snapToGrid}
            transitionSource={selectedTransitionSource}
            activeStates={simulation.currentStates}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onAddState={addState}
            onNodeToolAction={handleNodeToolAction}
            onEdgeToolAction={handleEdgeToolAction}
            onConnectTransition={handleConnectTransition}
          />

          <BottomControls
            mode={mode}
            nodes={nodes}
            warnings={warnings}
            onStart={startAndRunSimulation}
            onStep={stepSimulation}
            onRun={runSimulation}
            onReset={resetSimulation}
            onAddTransition={addTransition}
            onGeneratePatterns={generateOutputPatterns}
            onExport={exportJson}
            onImport={importJson}
          />
        </main>

        <RightTracePanel
          simulation={simulation}
          outputPatternReport={outputPatternReport}
          outputPatternMessage={outputPatternMessage}
        />
      </div>
    </ReactFlowProvider>
  )
}

export default App
