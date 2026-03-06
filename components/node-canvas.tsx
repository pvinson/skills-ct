"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import type { SkillNode, Connection } from "@/lib/types"
import { SkillNodeComponent } from "./skill-node"

interface NodeCanvasProps {
  nodes: SkillNode[]
  connections: Connection[]
  selectedNodeId: string | null
  onSelectNode: (id: string | null) => void
  onUpdateNode: (id: string, updates: Partial<SkillNode>) => void
  onRemoveNode: (id: string) => void
  onDuplicateNode: (id: string) => void
  onAddConnection: (fromId: string, toId: string) => void
  onRemoveConnection: (id: string) => void
}

function getConnectorPos(node: SkillNode, side: "left" | "right") {
  const y = node.y + 28
  if (side === "left") return { x: node.x, y }
  return { x: node.x + node.width, y }
}

const SNAP_DISTANCE = 10

export function NodeCanvas({
  nodes,
  connections,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
  onRemoveNode,
  onDuplicateNode,
  onAddConnection,
  onRemoveConnection,
}: NodeCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 })

  // Connection dragging
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [connectingMouse, setConnectingMouse] = useState({ x: 0, y: 0 })
  const [snapTarget, setSnapTarget] = useState<string | null>(null)

  // Connection delete hover state: track which connection endpoint is hovered
  const [hoveredConnEndpoint, setHoveredConnEndpoint] = useState<{
    connId: string
    x: number
    y: number
  } | null>(null)

  // Find closest input connector within SNAP_DISTANCE (in screen pixels)
  const findSnapTarget = useCallback(
    (mouseX: number, mouseY: number, sourceId: string): { nodeId: string; pos: { x: number; y: number } } | null => {
      if (!canvasRef.current) return null
      const rect = canvasRef.current.getBoundingClientRect()
      let closest: { nodeId: string; pos: { x: number; y: number }; dist: number } | null = null

      for (const n of nodes) {
        if (n.id === sourceId) continue
        // Input connector is on the left side of the node
        const inputPos = getConnectorPos(n, "left")
        // Convert canvas coordinates to screen coordinates
        const screenX = inputPos.x * scale + offset.x + rect.left
        const screenY = inputPos.y * scale + offset.y + rect.top
        const dist = Math.hypot(mouseX - screenX, mouseY - screenY)
        if (dist <= SNAP_DISTANCE && (!closest || dist < closest.dist)) {
          closest = { nodeId: n.id, pos: inputPos, dist }
        }
      }
      return closest ? { nodeId: closest.nodeId, pos: closest.pos } : null
    },
    [nodes, scale, offset]
  )

  // Pan: middle mouse or right-click drag on background
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== canvasRef.current && !(e.target as HTMLElement).closest("[data-canvas-bg]")) return
      if (e.button === 0) {
        // Left click on background -> deselect
        onSelectNode(null)
      }
      if (e.button === 1 || e.button === 0) {
        e.preventDefault()
        setIsPanning(true)
        panStart.current = {
          x: e.clientX,
          y: e.clientY,
          offsetX: offset.x,
          offsetY: offset.y,
        }
      }
    },
    [offset, onSelectNode]
  )

  useEffect(() => {
    if (!isPanning) return
    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - panStart.current.x
      const dy = e.clientY - panStart.current.y
      setOffset({
        x: panStart.current.offsetX + dx,
        y: panStart.current.offsetY + dy,
      })
    }
    const handleUp = () => setIsPanning(false)
    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleUp)
    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
    }
  }, [isPanning])

  // Zoom - only on pinch-to-zoom (ctrlKey) or when not inside a node's content area
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      // Pinch-to-zoom (trackpad) always zooms the canvas
      const isPinchZoom = e.ctrlKey || e.metaKey
      
      // Check if the target is inside a node's scrollable content area
      const target = e.target as HTMLElement
      const isInsideNodeContent = target.closest(".node-content-area")
      
      if (isInsideNodeContent && !isPinchZoom) {
        // Regular scroll inside node content - let it scroll naturally
        // Don't prevent default, let the textarea handle scroll
        return
      }
      
      // Zoom toward cursor position
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.98 : 1.02
      const newScale = Math.max(0.2, Math.min(3, scale * delta))
      
      if (!canvasRef.current) {
        setScale(newScale)
        return
      }
      
      // Get cursor position relative to the canvas container
      const rect = canvasRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      // Calculate the point in canvas coordinates under the cursor
      const canvasX = (mouseX - offset.x) / scale
      const canvasY = (mouseY - offset.y) / scale
      
      // Calculate new offset to keep the point under cursor fixed
      const newOffsetX = mouseX - canvasX * newScale
      const newOffsetY = mouseY - canvasY * newScale
      
      setScale(newScale)
      setOffset({ x: newOffsetX, y: newOffsetY })
    },
    [scale, offset]
  )

  // Connection start
  const handleConnectionStart = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      setConnectingFrom(nodeId)
      setConnectingMouse({ x: e.clientX, y: e.clientY })
    },
    []
  )

  // Connection drag + release with snap
  useEffect(() => {
    if (!connectingFrom) return
    const handleMove = (e: MouseEvent) => {
      setConnectingMouse({ x: e.clientX, y: e.clientY })
      const snap = findSnapTarget(e.clientX, e.clientY, connectingFrom)
      setSnapTarget(snap ? snap.nodeId : null)
    }
    const handleUp = (e: MouseEvent) => {
      // First check snap target
      const snap = findSnapTarget(e.clientX, e.clientY, connectingFrom)
      if (snap && snap.nodeId !== connectingFrom) {
        onAddConnection(connectingFrom, snap.nodeId)
      } else {
        // Fallback to element-based detection
        const target = document.elementFromPoint(e.clientX, e.clientY)
        if (target) {
          const inputConnector = target.closest("[data-connector='input']")
          if (inputConnector) {
            const targetNodeId = inputConnector.getAttribute("data-node-id")
            if (targetNodeId && targetNodeId !== connectingFrom) {
              onAddConnection(connectingFrom, targetNodeId)
            }
          }
        }
      }
      setConnectingFrom(null)
      setSnapTarget(null)
    }
    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleUp)
    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
    }
  }, [connectingFrom, onAddConnection, findSnapTarget])

  // Track mouse proximity to connection endpoints for delete button
  const handleTransformMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (connectingFrom || isPanning) {
        setHoveredConnEndpoint(null)
        return
      }
      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      // Convert screen coords to canvas coords
      const canvasX = (e.clientX - rect.left - offset.x) / scale
      const canvasY = (e.clientY - rect.top - offset.y) / scale

      let closest: { connId: string; x: number; y: number; dist: number } | null = null

      for (const conn of connections) {
        const fromNode = nodes.find((n) => n.id === conn.fromNodeId)
        const toNode = nodes.find((n) => n.id === conn.toNodeId)
        if (!fromNode || !toNode) continue

        // Check output endpoint (right side of fromNode)
        const outPos = getConnectorPos(fromNode, "right")
        const distOut = Math.hypot(canvasX - outPos.x, canvasY - outPos.y)
        if (distOut <= 10 / scale && (!closest || distOut < closest.dist)) {
          closest = { connId: conn.id, x: outPos.x, y: outPos.y, dist: distOut }
        }

        // Check input endpoint (left side of toNode)
        const inPos = getConnectorPos(toNode, "left")
        const distIn = Math.hypot(canvasX - inPos.x, canvasY - inPos.y)
        if (distIn <= 10 / scale && (!closest || distIn < closest.dist)) {
          closest = { connId: conn.id, x: inPos.x, y: inPos.y, dist: distIn }
        }
      }

      if (closest) {
        setHoveredConnEndpoint({ connId: closest.connId, x: closest.x, y: closest.y })
      } else {
        setHoveredConnEndpoint(null)
      }
    },
    [connections, nodes, offset, scale, connectingFrom, isPanning]
  )

  // Compute SVG connection lines
  const connectionLines = connections.map((conn) => {
    const fromNode = nodes.find((n) => n.id === conn.fromNodeId)
    const toNode = nodes.find((n) => n.id === conn.toNodeId)
    if (!fromNode || !toNode) return null
    const from = getConnectorPos(fromNode, "right")
    const to = getConnectorPos(toNode, "left")
    return { ...conn, from, to }
  }).filter(Boolean)

  // Dragging line (from output to mouse)
  let dragLine: { from: { x: number; y: number }; to: { x: number; y: number }; snapped: boolean } | null = null
  if (connectingFrom) {
    const fromNode = nodes.find((n) => n.id === connectingFrom)
    if (fromNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const from = getConnectorPos(fromNode, "right")
      // If snapped, draw line to the target connector; otherwise follow cursor
      const snappedNode = snapTarget ? nodes.find((n) => n.id === snapTarget) : null
      const to = snappedNode
        ? getConnectorPos(snappedNode, "left")
        : {
            x: (connectingMouse.x - rect.left - offset.x) / scale,
            y: (connectingMouse.y - rect.top - offset.y) / scale,
          }
      dragLine = { from, to, snapped: !!snappedNode }
    }
  }

  return (
    <div
      ref={canvasRef}
      className="absolute inset-0 overflow-hidden"
      onMouseDown={handleCanvasMouseDown}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
      style={{ cursor: isPanning ? "grabbing" : "default" }}
    >
      {/* Grid dots background */}
      <div data-canvas-bg className="absolute inset-0" style={{ pointerEvents: "all" }}>
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern
              id="grid-dots"
              x={offset.x % (20 * scale)}
              y={offset.y % (20 * scale)}
              width={20 * scale}
              height={20 * scale}
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx={1}
                cy={1}
                r={0.8}
                fill="rgba(255,255,255,0.08)"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-dots)" />
        </svg>
      </div>

      {/* Transform layer */}
      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
        }}
        onMouseMove={handleTransformMouseMove}
        onMouseLeave={() => setHoveredConnEndpoint(null)}
      >
        {/* SVG for connections */}
        <svg
          className="absolute pointer-events-none"
          style={{
            left: 0,
            top: 0,
            width: 10000,
            height: 10000,
            overflow: "visible",
          }}
        >
          {connectionLines.map((line) => {
            if (!line) return null
            const dx = line.to.x - line.from.x
            return (
              <g key={line.id}>
                <path
                  d={`M ${line.from.x} ${line.from.y} C ${line.from.x + Math.abs(dx) * 0.5} ${line.from.y}, ${line.to.x - Math.abs(dx) * 0.5} ${line.to.y}, ${line.to.x} ${line.to.y}`}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                />
              </g>
            )
          })}
          {dragLine && (
            <>
              <path
                d={`M ${dragLine.from.x} ${dragLine.from.y} C ${dragLine.from.x + 100} ${dragLine.from.y}, ${dragLine.to.x - 100} ${dragLine.to.y}, ${dragLine.to.x} ${dragLine.to.y}`}
                fill="none"
                stroke="#f97316"
                strokeWidth={dragLine.snapped ? 2.5 : 2}
                strokeDasharray={dragLine.snapped ? "none" : "6 3"}
                opacity={dragLine.snapped ? 1 : 0.6}
              />
              {dragLine.snapped && (
                <circle
                  cx={dragLine.to.x}
                  cy={dragLine.to.y}
                  r={8}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth={2}
                  opacity={0.6}
                >
                  <animate attributeName="r" values="6;10;6" dur="1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite" />
                </circle>
              )}
            </>
          )}

          {/* Connection delete button */}
          {hoveredConnEndpoint && (
            <g
              style={{ cursor: "pointer", pointerEvents: "auto" }}
              onClick={(e) => {
                e.stopPropagation()
                onRemoveConnection(hoveredConnEndpoint.connId)
                setHoveredConnEndpoint(null)
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <circle
                cx={hoveredConnEndpoint.x}
                cy={hoveredConnEndpoint.y}
                r={10}
                fill="white"
                stroke="rgba(0,0,0,0.15)"
                strokeWidth={1}
              />
              <line
                x1={hoveredConnEndpoint.x - 4}
                y1={hoveredConnEndpoint.y - 4}
                x2={hoveredConnEndpoint.x + 4}
                y2={hoveredConnEndpoint.y + 4}
                stroke="#ef4444"
                strokeWidth={2}
                strokeLinecap="round"
              />
              <line
                x1={hoveredConnEndpoint.x + 4}
                y1={hoveredConnEndpoint.y - 4}
                x2={hoveredConnEndpoint.x - 4}
                y2={hoveredConnEndpoint.y + 4}
                stroke="#ef4444"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </g>
          )}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => (
          <SkillNodeComponent
            key={node.id}
            node={node}
            onUpdate={onUpdateNode}
            onRemove={onRemoveNode}
            onDuplicate={onDuplicateNode}
            onSelect={onSelectNode}
            isSelected={selectedNodeId === node.id}
            onConnectionStart={handleConnectionStart}
            canvasOffset={offset}
            canvasScale={scale}
            connections={connections}
            allNodes={nodes}
          />
        ))}
      </div>
    </div>
  )
}
