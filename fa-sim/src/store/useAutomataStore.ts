import { applyEdgeChanges, applyNodeChanges, MarkerType } from '@xyflow/react'
import type { EdgeChange, NodeChange, XYPosition } from '@xyflow/react'
import { create } from 'zustand'
import {
  createInitialSimulation,
  runSingleStep,
  runToCompletion,
  validateDfaConstraints,
} from '../logic/simulator'
import type {
  AutomataMode,
  FAStateNode,
  FATransitionEdge,
  FASerialized,
  OutputPatternReport,
  SimulationState,
  ToolType,
} from '../types/automata'

interface Snapshot {
  nodes: FAStateNode[]
  edges: FATransitionEdge[]
}

interface AutomataStore {
  mode: AutomataMode
  tool: ToolType
  darkMode: boolean
  snapToGrid: boolean
  nodes: FAStateNode[]
  edges: FATransitionEdge[]
  simulation: SimulationState
  outputPatternReport: OutputPatternReport | null
  outputPatternMessage: string
  warnings: string[]
  selectedTransitionSource: string | null
  stateCounter: number
  past: Snapshot[]
  future: Snapshot[]
  setMode: (mode: AutomataMode) => void
  setTool: (tool: ToolType) => void
  toggleDarkMode: () => void
  toggleSnapToGrid: () => void
  onNodesChange: (changes: NodeChange<FAStateNode>[]) => void
  onEdgesChange: (changes: EdgeChange<FATransitionEdge>[]) => void
  addState: (position: XYPosition) => void
  deleteSelected: () => void
  deleteNodeById: (id: string) => void
  deleteEdgeById: (id: string) => void
  toggleInitial: (id: string) => void
  toggleFinal: (id: string) => void
  editStateLabel: (id: string, label: string) => void
  addTransition: (from: string, to: string, symbolsRaw: string) => void
  editTransitionLabel: (edgeId: string, symbolsRaw: string) => void
  beginTransition: (id: string) => void
  clearTransitionDraft: () => void
  setWarnings: (warnings: string[]) => void
  startSimulation: (input: string) => void
  startAndRunSimulation: (input: string) => void
  generateOutputPatterns: (maxLength: number, alphabetRaw: string) => void
  stepSimulation: () => void
  runSimulation: () => void
  resetSimulation: () => void
  exportJson: () => string
  importJson: (raw: string) => { ok: boolean; error?: string }
  undo: () => void
  redo: () => void
}

const emptySimulation: SimulationState = {
  status: 'idle',
  input: '',
  index: 0,
  currentStates: [],
  path: [],
  logs: [],
  stepRecords: [],
}

const MAX_PATTERN_LENGTH = 6
const MAX_PATTERN_STRINGS = 2500

const createSnapshot = (nodes: FAStateNode[], edges: FATransitionEdge[]): Snapshot => ({
  nodes: structuredClone(nodes),
  edges: structuredClone(edges),
})

const parseSymbols = (raw: string): string[] => {
  const normalized = raw
    .split(/[\s,;|]+/g)
    .map((s) => s.trim())
    .filter(Boolean)

  return [...new Set(normalized)]
}

const inferAlphabetFromEdges = (edges: FATransitionEdge[]): string[] => {
  const all = edges.flatMap((edge) => edge.data?.symbols ?? [])
  return [...new Set(all.filter((symbol) => symbol && symbol !== 'ε'))]
}

const enumerateInputs = (
  alphabet: string[],
  maxLength: number,
  maxItems: number,
): { inputs: string[]; truncated: boolean } => {
  const inputs: string[] = ['']
  if (inputs.length >= maxItems) {
    return { inputs, truncated: true }
  }

  let previousLevel = ['']
  let truncated = false

  for (let length = 1; length <= maxLength; length += 1) {
    const currentLevel: string[] = []
    for (const prefix of previousLevel) {
      for (const symbol of alphabet) {
        const next = `${prefix}${symbol}`
        currentLevel.push(next)
        inputs.push(next)

        if (inputs.length >= maxItems) {
          truncated = true
          return { inputs, truncated }
        }
      }
    }
    previousLevel = currentLevel
  }

  return { inputs, truncated }
}

export const useAutomataStore = create<AutomataStore>((set, get) => ({
  mode: 'NFA',
  tool: 'select',
  darkMode: false,
  snapToGrid: true,
  nodes: [],
  edges: [],
  simulation: emptySimulation,
  outputPatternReport: null,
  outputPatternMessage: '',
  warnings: [],
  selectedTransitionSource: null,
  stateCounter: 0,
  past: [],
  future: [],

  setMode: (mode) => {
    set({ mode })
    if (mode === 'DFA') {
      const check = validateDfaConstraints(get().edges)
      set({ warnings: check.errors })
    }
  },

  setTool: (tool) => set({ tool, selectedTransitionSource: null }),

  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges<FAStateNode>(changes, state.nodes),
    }))
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges<FATransitionEdge>(changes, state.edges),
    }))
  },

  addState: (position) => {
    const { nodes, edges, stateCounter } = get()
    const id = `q${stateCounter}`
    const nextNode: FAStateNode = {
      id,
      type: 'stateNode',
      position,
      data: { label: id, isInitial: nodes.length === 0, isFinal: false },
    }

    set((state) => ({
      nodes: [...state.nodes, nextNode],
      stateCounter: state.stateCounter + 1,
      past: [...state.past.slice(-99), createSnapshot(nodes, edges)],
      future: [],
    }))
  },

  deleteSelected: () => {
    const { nodes, edges } = get()
    const snapshot = createSnapshot(nodes, edges)
    const selectedIds = new Set(nodes.filter((node) => node.selected).map((node) => node.id))
    const selectedEdges = new Set(edges.filter((edge) => edge.selected).map((edge) => edge.id))

    set((state) => ({
      nodes: state.nodes.filter((node) => !selectedIds.has(node.id)),
      edges: state.edges.filter(
        (edge) =>
          !selectedEdges.has(edge.id) &&
          !selectedIds.has(edge.source) &&
          !selectedIds.has(edge.target),
      ),
      past: [...state.past.slice(-99), snapshot],
      future: [],
    }))
  },

  deleteNodeById: (id) => {
    const { nodes, edges } = get()
    const snapshot = createSnapshot(nodes, edges)
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
      past: [...state.past.slice(-99), snapshot],
      future: [],
    }))
  },

  deleteEdgeById: (id) => {
    const { nodes, edges } = get()
    const snapshot = createSnapshot(nodes, edges)
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
      past: [...state.past.slice(-99), snapshot],
      future: [],
    }))
  },

  toggleInitial: (id) => {
    const { nodes, edges } = get()
    const snapshot = createSnapshot(nodes, edges)
    set((state) => ({
      nodes: state.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isInitial: node.id === id,
        },
      })),
      past: [...state.past.slice(-99), snapshot],
      future: [],
    }))
  },

  toggleFinal: (id) => {
    const { nodes, edges } = get()
    const snapshot = createSnapshot(nodes, edges)
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, isFinal: !node.data.isFinal } }
          : node,
      ),
      past: [...state.past.slice(-99), snapshot],
      future: [],
    }))
  },

  editStateLabel: (id, label) => {
    if (!label.trim()) return
    const { nodes, edges } = get()
    const snapshot = createSnapshot(nodes, edges)
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, label: label.trim() } } : node,
      ),
      past: [...state.past.slice(-99), snapshot],
      future: [],
    }))
  },

  addTransition: (from, to, symbolsRaw) => {
    const symbols = parseSymbols(symbolsRaw)
    if (!symbols.length) return

    const { nodes, edges, mode } = get()
    const snapshot = createSnapshot(nodes, edges)
    const existing = edges.find((edge) => edge.source === from && edge.target === to)

    const nextEdges = existing
      ? edges.map((edge) => {
          if (edge.id !== existing.id) {
            return edge
          }

          const mergedSymbols = [...new Set([...(edge.data?.symbols ?? []), ...symbols])]
          return {
            ...edge,
            label: mergedSymbols.join(','),
            data: { symbols: mergedSymbols },
          }
        })
      : [
          ...edges,
          {
            id: `e-${from}-${to}-${Date.now()}`,
            source: from,
            target: to,
            type: 'smoothstep',
            label: symbols.join(','),
            data: { symbols },
            markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
            style: { strokeWidth: 1.8 },
          },
        ]

    const warnings = mode === 'DFA' ? validateDfaConstraints(nextEdges).errors : []

    set((state) => ({
      edges: nextEdges,
      warnings,
      selectedTransitionSource: null,
      past: [...state.past.slice(-99), snapshot],
      future: [],
    }))
  },

  editTransitionLabel: (edgeId, symbolsRaw) => {
    const symbols = parseSymbols(symbolsRaw)
    if (!symbols.length) return

    const { nodes, edges, mode } = get()
    const snapshot = createSnapshot(nodes, edges)

    const nextEdges = edges.map((edge) =>
      edge.id === edgeId
        ? {
            ...edge,
            label: symbols.join(','),
            data: { symbols },
          }
        : edge,
    )

    set((state) => ({
      edges: nextEdges,
      warnings: mode === 'DFA' ? validateDfaConstraints(nextEdges).errors : [],
      past: [...state.past.slice(-99), snapshot],
      future: [],
    }))
  },

  beginTransition: (id) => set({ selectedTransitionSource: id }),

  clearTransitionDraft: () => set({ selectedTransitionSource: null }),

  setWarnings: (warnings) => set({ warnings }),

  startSimulation: (input) => {
    const { nodes, edges } = get()
    const initialStates = nodes.filter((node) => node.data.isInitial).map((node) => node.id)

    set({
      simulation: createInitialSimulation(input, initialStates, edges),
    })
  },

  startAndRunSimulation: (input) => {
    const { mode, nodes, edges } = get()
    const initialStates = nodes.filter((node) => node.data.isInitial).map((node) => node.id)
    const finalStates = new Set(nodes.filter((node) => node.data.isFinal).map((node) => node.id))
    const initial = createInitialSimulation(input, initialStates, edges)
    const completed = runToCompletion(initial, mode, finalStates, edges)

    set({ simulation: completed })
  },

  generateOutputPatterns: (maxLength, alphabetRaw) => {
    const { mode, nodes, edges } = get()
    const requestedMaxLength = Math.max(0, Math.floor(maxLength))
    const effectiveMaxLength = Math.min(requestedMaxLength, MAX_PATTERN_LENGTH)
    const typedAlphabet = parseSymbols(alphabetRaw)
    const alphabet = typedAlphabet.length > 0 ? typedAlphabet : inferAlphabetFromEdges(edges)

    if (alphabet.length === 0) {
      set({
        outputPatternReport: null,
        outputPatternMessage:
          'No alphabet found. Enter symbols manually (for example: 0,1) or add transitions first.',
      })
      return
    }

    const initialStates = nodes.filter((node) => node.data.isInitial).map((node) => node.id)
    if (initialStates.length === 0) {
      set({
        outputPatternReport: null,
        outputPatternMessage: 'Cannot generate patterns: no initial state is set.',
      })
      return
    }

    const finalStates = new Set(nodes.filter((node) => node.data.isFinal).map((node) => node.id))
    const generated = enumerateInputs(alphabet, effectiveMaxLength, MAX_PATTERN_STRINGS)

    const rows = generated.inputs.map((input) => {
      const initial = createInitialSimulation(input, initialStates, edges)
      const completed = runToCompletion(initial, mode, finalStates, edges)
      return {
        input,
        result: completed.status === 'accepted' ? 'Accepted' : 'Rejected',
      } as const
    })

    const acceptedCount = rows.filter((row) => row.result === 'Accepted').length
    const rejectedCount = rows.length - acceptedCount

    set({
      outputPatternReport: {
        alphabet,
        requestedMaxLength,
        effectiveMaxLength,
        totalChecked: rows.length,
        acceptedCount,
        rejectedCount,
        truncated: generated.truncated,
        rows,
      },
      outputPatternMessage: generated.truncated
        ? `Results truncated at ${MAX_PATTERN_STRINGS} strings for speed.`
        : '',
    })
  },

  stepSimulation: () => {
    const { simulation, mode, nodes, edges } = get()
    const finalStates = new Set(nodes.filter((node) => node.data.isFinal).map((node) => node.id))
    set({ simulation: runSingleStep(simulation, mode, finalStates, edges) })
  },

  runSimulation: () => {
    const { simulation, mode, nodes, edges } = get()
    const finalStates = new Set(nodes.filter((node) => node.data.isFinal).map((node) => node.id))
    set({ simulation: runToCompletion(simulation, mode, finalStates, edges) })
  },

  resetSimulation: () => set({ simulation: emptySimulation }),

  exportJson: () => {
    const { mode, nodes, edges } = get()
    const payload: FASerialized = {
      mode,
      states: nodes.map((node) => ({
        id: node.id,
        label: node.data.label,
        isInitial: node.data.isInitial,
        isFinal: node.data.isFinal,
        position: node.position,
      })),
      transitions: edges.map((edge) => ({
        from: edge.source,
        to: edge.target,
        symbols: edge.data?.symbols ?? [],
      })),
    }
    return JSON.stringify(payload, null, 2)
  },

  importJson: (raw) => {
    try {
      const parsed = JSON.parse(raw) as FASerialized
      if (!parsed.states || !parsed.transitions || !parsed.mode) {
        return { ok: false, error: 'Invalid schema. Expected mode, states, and transitions.' }
      }

      const importedNodes: FAStateNode[] = parsed.states.map((state) => ({
        id: state.id,
        type: 'stateNode',
        position: state.position,
        data: {
          label: state.label,
          isInitial: state.isInitial,
          isFinal: state.isFinal,
        },
      }))

      const importedEdges: FATransitionEdge[] = parsed.transitions.map((transition, index) => ({
        id: `e-import-${index}-${transition.from}-${transition.to}`,
        source: transition.from,
        target: transition.to,
        type: 'default',
        label: transition.symbols.join(','),
        data: { symbols: transition.symbols },
        markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
        style: { strokeWidth: 1.8 },
      }))

      const maxCounter = importedNodes.reduce((max, node) => {
        const numeric = Number(node.id.replace(/^q/, ''))
        return Number.isNaN(numeric) ? max : Math.max(max, numeric)
      }, -1)

      set((state) => ({
        nodes: importedNodes,
        edges: importedEdges,
        mode: parsed.mode,
        simulation: emptySimulation,
        warnings: parsed.mode === 'DFA' ? validateDfaConstraints(importedEdges).errors : [],
        stateCounter: maxCounter + 1,
        past: [...state.past.slice(-99), createSnapshot(state.nodes, state.edges)],
        future: [],
      }))

      return { ok: true }
    } catch {
      return { ok: false, error: 'Could not parse JSON.' }
    }
  },

  undo: () => {
    const { past, nodes, edges, future } = get()
    if (!past.length) return

    const previous = past[past.length - 1]
    set({
      nodes: previous.nodes,
      edges: previous.edges,
      past: past.slice(0, -1),
      future: [...future.slice(-99), createSnapshot(nodes, edges)],
      simulation: emptySimulation,
    })
  },

  redo: () => {
    const { past, nodes, edges, future } = get()
    if (!future.length) return

    const next = future[future.length - 1]
    set({
      nodes: next.nodes,
      edges: next.edges,
      future: future.slice(0, -1),
      past: [...past.slice(-99), createSnapshot(nodes, edges)],
      simulation: emptySimulation,
    })
  },
}))
