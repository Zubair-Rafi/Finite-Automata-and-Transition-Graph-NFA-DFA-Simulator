import { useMemo } from 'react'
import type { MouseEvent } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type EdgeChange,
  type EdgeMouseHandler,
  type NodeChange,
  type NodeMouseHandler,
  useReactFlow,
} from '@xyflow/react'
import type { ToolType } from '../types/automata'
import type { FAStateNode, FATransitionEdge } from '../types/automata'
import StateNode from './StateNode'

interface AutomataCanvasProps {
  nodes: FAStateNode[]
  edges: FATransitionEdge[]
  activeTool: ToolType
  snapToGrid: boolean
  transitionSource: string | null
  activeStates: string[]
  onNodesChange: (changes: NodeChange<FAStateNode>[]) => void
  onEdgesChange: (changes: EdgeChange<FATransitionEdge>[]) => void
  onAddState: (position: { x: number; y: number }) => void
  onNodeToolAction: (nodeId: string) => void
  onEdgeToolAction: (edgeId: string) => void
  onConnectTransition: (from: string, to: string) => void
}

const nodeTypes = { stateNode: StateNode }

function AutomataCanvas({
  nodes,
  edges,
  activeTool,
  snapToGrid,
  transitionSource,
  activeStates,
  onNodesChange,
  onEdgesChange,
  onAddState,
  onNodeToolAction,
  onEdgeToolAction,
  onConnectTransition,
}: AutomataCanvasProps) {
  const { screenToFlowPosition } = useReactFlow<FAStateNode, FATransitionEdge>()

  const decoratedNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        className: activeStates.includes(node.id) ? 'node-active' : '',
      })),
    [nodes, activeStates],
  )

  const decoratedEdges = useMemo(
    () =>
      edges.map((edge) => ({
        ...edge,
        className: transitionSource === edge.source ? 'edge-source-active' : '',
      })),
    [edges, transitionSource],
  )

  const onPaneClick = (event: MouseEvent) => {
    if (activeTool === 'add-state') {
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      onAddState(position)
    }
  }

  const onNodeClick: NodeMouseHandler<FAStateNode> = (_, node) => {
    onNodeToolAction(node.id)
  }

  const onEdgeClick: EdgeMouseHandler<FATransitionEdge> = (_, edge) => {
    onEdgeToolAction(edge.id)
  }

  const onConnect = (connection: Connection) => {
    if (connection.source && connection.target) {
      onConnectTransition(connection.source, connection.target)
    }
  }

  return (
    <section className="canvas-shell panel">
      <div className="canvas-header">
        <h1>Finite Automata Studio by Zubair Rafi</h1>
        <p>
          {activeTool === 'add-transition' && transitionSource
            ? `Transition source selected: ${transitionSource}. Click destination state.`
            : 'Build DFA/NFA visually, then simulate step-by-step.'}
        </p>
      </div>

      <div className="canvas-area">
        <ReactFlow<FAStateNode, FATransitionEdge>
          nodes={decoratedNodes}
          edges={decoratedEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onPaneClick={onPaneClick}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onConnect={onConnect}
          fitView
          snapToGrid={snapToGrid}
          snapGrid={[16, 16]}
          panOnDrag
          selectionOnDrag={activeTool === 'select'}
          elementsSelectable
          zoomOnScroll
          panOnScroll
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} size={1} />
          <MiniMap zoomable pannable />
          <Controls showInteractive />
        </ReactFlow>
      </div>
    </section>
  )
}

export default AutomataCanvas
