import type { AutomataMode, FATransitionEdge, SimulationState, StepRecord } from '../types/automata'

const EPSILON = 'ε'

interface TransitionIndex {
  [from: string]: {
    [symbol: string]: string[]
  }
}

const normalizeSymbol = (symbol: string) => symbol.trim()

const buildTransitionIndex = (edges: FATransitionEdge[]): TransitionIndex => {
  const index: TransitionIndex = {}

  for (const edge of edges) {
    const from = edge.source
    const to = edge.target
    const symbols = edge.data?.symbols ?? []

    index[from] ??= {}

    for (const raw of symbols) {
      const symbol = normalizeSymbol(raw)
      if (!symbol) {
        continue
      }
      index[from][symbol] ??= []
      if (!index[from][symbol].includes(to)) {
        index[from][symbol].push(to)
      }
    }
  }

  return index
}

const epsilonClosure = (states: Set<string>, transitions: TransitionIndex): Set<string> => {
  const closure = new Set(states)
  const stack = [...states]

  while (stack.length > 0) {
    const current = stack.pop() as string
    const epsilonTargets = transitions[current]?.[EPSILON] ?? []
    for (const target of epsilonTargets) {
      if (!closure.has(target)) {
        closure.add(target)
        stack.push(target)
      }
    }
  }

  return closure
}

const transitionOnSymbol = (
  states: Set<string>,
  symbol: string,
  transitions: TransitionIndex,
): Set<string> => {
  const next = new Set<string>()
  for (const state of states) {
    const targets = transitions[state]?.[symbol] ?? []
    for (const target of targets) {
      next.add(target)
    }
  }
  return next
}

const unique = (arr: string[]) => [...new Set(arr)]

const toLog = (record: StepRecord): string =>
  `Step ${record.step}: ${record.from} --${record.symbol}--> ${record.to}`

export const createInitialSimulation = (
  input: string,
  initialStates: string[],
  edges: FATransitionEdge[],
): SimulationState => {
  const transitions = buildTransitionIndex(edges)
  const seeded = epsilonClosure(new Set(initialStates), transitions)

  return {
    status: seeded.size > 0 ? 'running' : 'rejected',
    input,
    index: 0,
    currentStates: [...seeded],
    path: unique([...seeded]),
    logs: seeded.size > 0 ? [] : ['No initial state configured.'],
    stepRecords: [],
    error: seeded.size > 0 ? undefined : 'No initial state configured.',
  }
}

export const runSingleStep = (
  simulation: SimulationState,
  mode: AutomataMode,
  finalStates: Set<string>,
  edges: FATransitionEdge[],
): SimulationState => {
  if (simulation.status !== 'running') {
    return simulation
  }

  const transitions = buildTransitionIndex(edges)

  if (simulation.index >= simulation.input.length) {
    const accepted = simulation.currentStates.some((state) => finalStates.has(state))
    return {
      ...simulation,
      status: accepted ? 'accepted' : 'rejected',
      logs: [...simulation.logs, accepted ? 'Input accepted.' : 'Input rejected.'],
    }
  }

  const symbol = simulation.input[simulation.index]
  const current = epsilonClosure(new Set(simulation.currentStates), transitions)
  const rawNext = transitionOnSymbol(current, symbol, transitions)
  const next = epsilonClosure(rawNext, transitions)

  if (next.size === 0) {
    return {
      ...simulation,
      index: simulation.index + 1,
      currentStates: [],
      status: 'rejected',
      logs: [...simulation.logs, `No transition found for symbol '${symbol}'.`],
    }
  }

  const nextArray = [...next]
  const records: StepRecord[] = []

  if (mode === 'DFA') {
    const from = simulation.currentStates[0] ?? '∅'
    const to = nextArray[0]
    records.push({ step: simulation.index + 1, from, symbol, to })
  } else {
    for (const from of simulation.currentStates) {
      for (const to of nextArray) {
        records.push({ step: simulation.index + 1, from, symbol, to })
      }
    }
  }

  return {
    ...simulation,
    index: simulation.index + 1,
    currentStates: nextArray,
    path: unique([...simulation.path, ...nextArray]),
    logs: [...simulation.logs, ...records.map(toLog)],
    stepRecords: [...simulation.stepRecords, ...records],
    status: 'running',
  }
}

export const runToCompletion = (
  simulation: SimulationState,
  mode: AutomataMode,
  finalStates: Set<string>,
  edges: FATransitionEdge[],
): SimulationState => {
  let next = simulation
  let guard = 0

  while (next.status === 'running' && guard < Math.max(1000, simulation.input.length + 10)) {
    next = runSingleStep(next, mode, finalStates, edges)
    guard += 1
  }

  return next
}

export const validateDfaConstraints = (
  edges: FATransitionEdge[],
): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  const seen: Record<string, Record<string, string>> = {}

  for (const edge of edges) {
    const from = edge.source
    seen[from] ??= {}

    for (const symbol of edge.data?.symbols ?? []) {
      const normalized = normalizeSymbol(symbol)
      if (!normalized) continue

      if (normalized === EPSILON) {
        errors.push(`DFA cannot contain epsilon transitions from ${from}.`)
      }

      if (seen[from][normalized] && seen[from][normalized] !== edge.target) {
        errors.push(
          `DFA violation: state ${from} has multiple targets for symbol '${normalized}'.`,
        )
      }

      seen[from][normalized] = edge.target
    }
  }

  return { valid: errors.length === 0, errors }
}

export { EPSILON }
