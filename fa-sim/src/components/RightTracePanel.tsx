import type { OutputPatternReport, SimulationState } from '../types/automata'

interface RightTracePanelProps {
  simulation: SimulationState
  outputPatternReport: OutputPatternReport | null
  outputPatternMessage: string
}

function RightTracePanel({
  simulation,
  outputPatternReport,
  outputPatternMessage,
}: RightTracePanelProps) {
  const remaining = simulation.input.slice(simulation.index)

  return (
    <aside className="right-sidebar panel">
      <h2>Execution Trace</h2>

      <div className="trace-block">
        <label>Status</label>
        <p className={`status ${simulation.status}`}>
          {simulation.status === 'idle' ? 'Idle' : simulation.status.toUpperCase()}
        </p>
      </div>

      <div className="trace-block">
        <label>Current State(s)</label>
        <p>{simulation.currentStates.length ? simulation.currentStates.join(', ') : 'None'}</p>
      </div>

      <div className="trace-block">
        <label>Remaining Input</label>
        <p>{remaining || '∅'}</p>
      </div>

      <div className="trace-block">
        <label>Transition Path</label>
        <p>{simulation.path.length ? simulation.path.join(' → ') : 'No path yet'}</p>
      </div>

      <div className="trace-block">
        <label>Step Log</label>
        <div className="log-box">
          {simulation.logs.length === 0 && <p className="muted">No steps executed.</p>}
          {simulation.logs.map((entry, index) => (
            <p key={`${entry}-${index}`}>{entry}</p>
          ))}
        </div>
      </div>

      <div className="trace-block">
        <label>Auto Output Patterns</label>
        {!outputPatternReport && <p className="muted">Generate patterns to inspect machine behavior.</p>}
        {outputPatternMessage && <p className="muted">{outputPatternMessage}</p>}

        {outputPatternReport && (
          <>
            <p>
              Alphabet: {outputPatternReport.alphabet.join(', ')} | Length: 0..
              {outputPatternReport.effectiveMaxLength}
            </p>
            <p>
              Accepted: {outputPatternReport.acceptedCount} | Rejected: {outputPatternReport.rejectedCount}
            </p>
            <div className="log-box">
              {outputPatternReport.rows.map((row, index) => (
                <p key={`${row.input}-${row.result}-${index}`}>
                  {row.input === '' ? 'ε' : row.input} {'->'} {row.result}
                </p>
              ))}
            </div>
          </>
        )}
      </div>
    </aside>
  )
}

export default RightTracePanel
