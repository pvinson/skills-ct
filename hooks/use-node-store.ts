"use client"

import { useState, useCallback } from "react"
import type { SkillNode, Connection, NodeType } from "@/lib/types"
import { NODE_CONFIGS } from "@/lib/types"

let nodeCounter = 0

function getUniqueTitle(type: NodeType, existingNodes: SkillNode[]): string {
  const config = NODE_CONFIGS[type]
  const baseTitle = config.defaultTitle
  
  // Get all titles of nodes with the same type
  const existingTitles = existingNodes
    .filter((n) => n.type === type)
    .map((n) => n.title)
  
  // If the base title is not taken, use it
  if (!existingTitles.includes(baseTitle)) {
    return baseTitle
  }
  
  // Otherwise, find the next available number
  let counter = 2
  while (existingTitles.includes(`${baseTitle}-${counter}`)) {
    counter++
  }
  return `${baseTitle}-${counter}`
}

function createNode(type: NodeType, x: number, y: number, existingNodes: SkillNode[]): SkillNode {
  nodeCounter++
  const config = NODE_CONFIGS[type]
  return {
    id: `node-${nodeCounter}`,
    type,
    x,
    y,
    width: 600,
    height: 600,
    title: getUniqueTitle(type, existingNodes),
    extension: config.defaultExtension,
    content: config.defaultContent,
    locked: false,
  }
}

export function useNodeStore() {
  const [nodes, setNodes] = useState<SkillNode[]>(() => {
    const mainNode = createNode("main", 200, 100, [])
    return [mainNode]
  })
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const addNode = useCallback((type: NodeType, x?: number, y?: number): SkillNode => {
    const posX = x ?? 250 + Math.random() * 200
    const posY = y ?? 100 + Math.random() * 200
    const node = createNode(type, posX, posY, nodes)
    setNodes((prev) => [...prev, node])
    return node
  }, [nodes])

  const updateNode = useCallback((id: string, updates: Partial<SkillNode>) => {
    // If content is being updated, check for removed references
    if (updates.content !== undefined) {
      const currentNode = nodes.find((n) => n.id === id)
      if (currentNode) {
        const oldContent = currentNode.content
        const newContent = updates.content
        
        // Extract references from content: [title](reference/title.md) or [title](asset/title.md) etc.
        const extractReferences = (content: string): string[] => {
          const refRegex = /\[([^\]]+)\]\((?:reference|assets?|scripts?)\/[^)]+\)/g
          const refs: string[] = []
          let match
          while ((match = refRegex.exec(content)) !== null) {
            refs.push(match[1]) // Extract the title from the link text
          }
          return refs
        }
        
        const oldRefs = extractReferences(oldContent)
        const newRefs = extractReferences(newContent)
        
        // Find removed references (in old but not in new)
        const removedRefs = oldRefs.filter((ref) => !newRefs.includes(ref))
        
        if (removedRefs.length > 0) {
          // Find connections to remove
          setConnections((prev) => 
            prev.filter((conn) => {
              // Only filter connections TO this node (where this node is the target)
              if (conn.toNodeId !== id) return true
              
              // Find the source node
              const fromNode = nodes.find((n) => n.id === conn.fromNodeId)
              if (!fromNode) return true
              
              // If the source node's title is in the removed refs, remove this connection
              return !removedRefs.includes(fromNode.title)
            })
          )
        }
      }
    }
    
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
    )
  }, [nodes])

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

      // Add markdown reference to target node's References section
      const subdirectory = fromNode.type === "reference" ? "reference" : "asset"
      const refLine = `- [${fromNode.title}](${subdirectory}/${fromNode.title}.md)`
      
      setNodes((prev) =>
        prev.map((n) => {
          if (n.id !== toNodeId) return n
          
          const content = n.content
          const referencesMatch = content.match(/## References\n/)
          
          if (referencesMatch && referencesMatch.index !== undefined) {
            // Find the position after "## References\n"
            const insertPos = referencesMatch.index + referencesMatch[0].length
            const newContent = 
              content.slice(0, insertPos) + 
              refLine + "\n" + 
              content.slice(insertPos)
            return { ...n, content: newContent }
          } else {
            // If no References section exists, add one at the end
            const newContent = content + "\n\n## References\n" + refLine
            return { ...n, content: newContent }
          }
        })
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
