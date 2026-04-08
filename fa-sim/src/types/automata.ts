import type { Edge, Node } from '@xyflow/react'

export type AutomataMode = 'DFA' | 'NFA'

export type ToolType =
  | 'select'
  | 'add-state'
  | 'add-transition'
  | 'toggle-initial'
  | 'toggle-final'
  | 'edit-label'
  | 'delete'

export interface StateNodeData {
  label: string
  isInitial: boolean
  isFinal: boolean
  [key: string]: unknown
}

export interface TransitionEdgeData {
  symbols: string[]
  [key: string]: unknown
}

export type FAStateNode = Node<StateNodeData, 'stateNode'>
export type FATransitionEdge = Edge<TransitionEdgeData>

export interface FASerialized {
  mode: AutomataMode
  states: Array<{
    id: string
    label: string
    isInitial: boolean
    isFinal: boolean
    position: { x: number; y: number }
  }>
  transitions: Array<{
    from: string
    to: string
    symbols: string[]
  }>
}

export interface StepRecord {
  step: number
  from: string
  symbol: string
  to: string
}

export interface SimulationState {
  status: 'idle' | 'running' | 'accepted' | 'rejected'
  input: string
  index: number
  currentStates: string[]
  path: string[]
  logs: string[]
  stepRecords: StepRecord[]
  error?: string
}

export interface OutputPatternRow {
  input: string
  result: 'Accepted' | 'Rejected'
}

export interface OutputPatternReport {
  alphabet: string[]
  requestedMaxLength: number
  effectiveMaxLength: number
  totalChecked: number
  acceptedCount: number
  rejectedCount: number
  truncated: boolean
  rows: OutputPatternRow[]
}
