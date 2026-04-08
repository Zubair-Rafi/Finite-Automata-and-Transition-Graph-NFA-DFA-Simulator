import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { FAStateNode } from '../types/automata'

function StateNode({ data, selected }: NodeProps<FAStateNode>) {
  return (
    <div
      className={`state-node ${selected ? 'is-selected' : ''} ${data.isInitial ? 'is-initial' : ''} ${data.isFinal ? 'is-final' : ''}`}
      title={data.label}
    >
      {data.isInitial && <span className="initial-marker" aria-hidden="true">&#x2192;</span>}
      <div className="state-inner">{data.label}</div>
      <Handle type="target" position={Position.Left} className="handle" />
      <Handle type="source" position={Position.Right} className="handle" />
      <Handle type="target" position={Position.Top} className="handle" />
      <Handle type="source" position={Position.Bottom} className="handle" />
    </div>
  )
}

export default StateNode
