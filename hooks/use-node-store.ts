"use client"

import { useState, useCallback } from "react"
import type { SkillNode, Connection, NodeType } from "@/lib/types"
import { NODE_CONFIGS } from "@/lib/types"

let nodeCounter = 0

function createNode(type: NodeType, x: number, y: number): SkillNode {
  nodeCounter++
  const config = NODE_CONFIGS[type]
  return {
    id: `node-${nodeCounter}`,
    type,
    x,
    y,
    width: 600,
    height: 600,
    title: config.defaultTitle,
    content: config.defaultContent,
    locked: false,
  }
}

export function useNodeStore() {
  const [nodes, setNodes] = useState<SkillNode[]>(() => {
    const mainNode = createNode("main", 200, 100)
    return [mainNode]
  })
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const addNode = useCallback((type: NodeType, x?: number, y?: number): SkillNode => {
    const posX = x ?? 250 + Math.random() * 200
    const posY = y ?? 100 + Math.random() * 200
    const node = createNode(type, posX, posY)
    setNodes((prev) => [...prev, node])
    return node
  }, [])

  const updateNode = useCallback((id: string, updates: Partial<SkillNode>) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
    )
  }, [])

  const duplicateNode = useCallback(
    (id: string) => {
      const source = nodes.find((n) => n.id === id)
      if (!source) return
      nodeCounter++
      const dup: SkillNode = {
        ...source,
        id: `node-${nodeCounter}`,
        x: source.x + 40,
        y: source.y + 40,
        title: `${source.title}-copy`,
        locked: false,
      }
      setNodes((prev) => [...prev, dup])
    },
    [nodes]
  )

  const removeNode = useCallback(
    (id: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== id))
      setConnections((prev) =>
        prev.filter((c) => c.fromNodeId !== id && c.toNodeId !== id)
      )
    },
    []
  )

  const addConnection = useCallback(
    (fromNodeId: string, toNodeId: string) => {
      const exists = connections.find(
        (c) => c.fromNodeId === fromNodeId && c.toNodeId === toNodeId
      )
      if (exists || fromNodeId === toNodeId) return

      const fromNode = nodes.find((n) => n.id === fromNodeId)
      if (!fromNode) return

      const connId = `conn-${Date.now()}`
      setConnections((prev) => [
        ...prev,
        { id: connId, fromNodeId, toNodeId },
      ])

      // Add markdown reference to target node
      const refLine = `\n@${fromNode.title}.md`
      setNodes((prev) =>
        prev.map((n) =>
          n.id === toNodeId
            ? { ...n, content: n.content + refLine }
            : n
        )
      )
    },
    [connections, nodes]
  )

  const removeConnection = useCallback((id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id))
  }, [])

  return {
    nodes,
    connections,
    selectedNodeId,
    setSelectedNodeId,
    addNode,
    updateNode,
    duplicateNode,
    removeNode,
    addConnection,
    removeConnection,
  }
}
