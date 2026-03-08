"use client"

import { useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, ChevronLeft } from "lucide-react"
import { NodeCanvas } from "@/components/node-canvas"
import { useNodeStore } from "@/hooks/use-node-store"
import type { NodeType } from "@/lib/types"

const NODE_TYPES: { type: NodeType; label: string }[] = [
  { type: "reference", label: "Reference" },
  { type: "asset", label: "Asset" },
  { type: "script", label: "Script" },
]

export default function CanvasPage() {
  const router = useRouter()
  const {
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
  } = useNodeStore()

  const handleAddNode = useCallback(
    (type: NodeType) => {
      addNode(type)
    },
    [addNode]
  )

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <button
          onClick={() => router.push("/home")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Back</span>
        </button>

        <div className="h-4 w-px bg-border" />

        <Link href="/home">
          <span className="text-base font-semibold text-foreground tracking-tight font-sans hover:text-muted-foreground transition-colors">
            skills.ct
          </span>
        </Link>

        <div className="flex items-center gap-2 ml-auto">
          {NODE_TYPES.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => handleAddNode(type)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border"
            >
              <Plus size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative flex-1">
        <NodeCanvas
          nodes={nodes}
          connections={connections}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onUpdateNode={updateNode}
          onRemoveNode={removeNode}
          onDuplicateNode={duplicateNode}
          onAddConnection={addConnection}
          onRemoveConnection={removeConnection}
        />
      </div>
    </div>
  )
}
