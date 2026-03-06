"use client"

import { useCallback } from "react"
import Link from "next/link"
import { Save, XCircle } from "lucide-react"
import { useNodeStore } from "@/hooks/use-node-store"
import { NodeCanvas } from "@/components/node-canvas"
import { FloatingToolbar } from "@/components/floating-toolbar"

export default function Home() {
  const {
    nodes,
    connections,
    selectedNodeId,
    setSelectedNodeId,
    addNode,
    updateNode,
    removeNode,
    duplicateNode,
    addConnection,
    removeConnection,
  } = useNodeStore()

  const handleAddReference = useCallback(() => {
    const mainNode = nodes.find((n) => n.type === "main")
    // Count existing non-main nodes to stagger vertically
    const nonMainNodes = nodes.filter((n) => n.type !== "main")
    const yOffset = nonMainNodes.length * 40
    const x = (mainNode ? mainNode.x - 700 : -500) + Math.random() * 40
    const y = (mainNode ? mainNode.y : 100) + yOffset + Math.random() * 40
    const newNode = addNode("reference", x, y)
    if (mainNode) {
      addConnection(newNode.id, mainNode.id)
    }
  }, [addNode, addConnection, nodes])

  const handleAddAsset = useCallback(() => {
    const mainNode = nodes.find((n) => n.type === "main")
    const nonMainNodes = nodes.filter((n) => n.type !== "main")
    const yOffset = nonMainNodes.length * 40
    const x = (mainNode ? mainNode.x - 700 : -500) + Math.random() * 40
    const y = (mainNode ? mainNode.y : 100) + yOffset + Math.random() * 40
    const newNode = addNode("asset", x, y)
    if (mainNode) {
      addConnection(newNode.id, mainNode.id)
    }
  }, [addNode, addConnection, nodes])

  const handleAddScript = useCallback(() => {
    const mainNode = nodes.find((n) => n.type === "main")
    const nonMainNodes = nodes.filter((n) => n.type !== "main")
    const yOffset = nonMainNodes.length * 40
    const x = (mainNode ? mainNode.x - 700 : -500) + Math.random() * 40
    const y = (mainNode ? mainNode.y : 100) + yOffset + Math.random() * 40
    const newNode = addNode("script", x, y)
    if (mainNode) {
      addConnection(newNode.id, mainNode.id)
    }
  }, [addNode, addConnection, nodes])

  const handleFormatText = useCallback(
    (format: string) => {
      if (!selectedNodeId) return
      const node = nodes.find((n) => n.id === selectedNodeId)
      if (!node) return

      // Get the active textarea
      const textarea = document.querySelector(
        `textarea`
      ) as HTMLTextAreaElement | null

      // Find the specific textarea within the selected node
      const allTextareas = document.querySelectorAll("textarea")
      let activeTextarea: HTMLTextAreaElement | null = null
      allTextareas.forEach((ta) => {
        if (document.activeElement === ta) {
          activeTextarea = ta
        }
      })

      if (!activeTextarea) {
        // If no textarea focused, apply to the selected node's content
        let newContent = node.content
        const formatMap: Record<string, string> = {
          h1: "\n# ",
          h2: "\n## ",
          h3: "\n### ",
          bold: "**text**",
          italic: "_text_",
          code: "`code`",
          ul: "\n- ",
          ol: "\n1. ",
          blockquote: "\n> ",
          hr: "\n---\n",
          link: "[text](url)",
          body: "\n",
        }
        newContent += formatMap[format] || ""
        updateNode(selectedNodeId, { content: newContent })
        return
      }

      const start = activeTextarea.selectionStart
      const end = activeTextarea.selectionEnd
      const selectedText = activeTextarea.value.substring(start, end)
      let replacement = ""
      let cursorOffset = 0

      switch (format) {
        case "h1":
          replacement = selectedText ? `# ${selectedText}` : "# "
          cursorOffset = replacement.length
          break
        case "h2":
          replacement = selectedText ? `## ${selectedText}` : "## "
          cursorOffset = replacement.length
          break
        case "h3":
          replacement = selectedText ? `### ${selectedText}` : "### "
          cursorOffset = replacement.length
          break
        case "bold":
          replacement = selectedText ? `**${selectedText}**` : "**text**"
          cursorOffset = selectedText ? replacement.length : start + 2
          break
        case "italic":
          replacement = selectedText ? `_${selectedText}_` : "_text_"
          cursorOffset = selectedText ? replacement.length : start + 1
          break
        case "code":
          replacement = selectedText ? `\`${selectedText}\`` : "`code`"
          cursorOffset = selectedText ? replacement.length : start + 1
          break
        case "ul":
          replacement = selectedText ? `- ${selectedText}` : "- "
          cursorOffset = replacement.length
          break
        case "ol":
          replacement = selectedText ? `1. ${selectedText}` : "1. "
          cursorOffset = replacement.length
          break
        case "blockquote":
          replacement = selectedText ? `> ${selectedText}` : "> "
          cursorOffset = replacement.length
          break
        case "hr":
          replacement = "\n---\n"
          cursorOffset = replacement.length
          break
        case "link":
          replacement = selectedText
            ? `[${selectedText}](url)`
            : "[text](url)"
          cursorOffset = replacement.length
          break
        case "body":
          replacement = selectedText || ""
          cursorOffset = replacement.length
          break
        default:
          replacement = selectedText
      }

      const newContent =
        activeTextarea.value.substring(0, start) +
        replacement +
        activeTextarea.value.substring(end)
      updateNode(selectedNodeId, { content: newContent })

      // Restore cursor position
      requestAnimationFrame(() => {
        activeTextarea!.focus()
        const pos = start + cursorOffset
        activeTextarea!.setSelectionRange(pos, pos)
      })
    },
    [selectedNodeId, nodes, updateNode]
  )

  const handleSave = useCallback(() => {
    // Build all files data
    const files = nodes.map((node) => ({
      filename: `${node.title}.md`,
      type: node.type,
      content: node.content,
    }))

    // Download as JSON bundle
    const blob = new Blob([JSON.stringify(files, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "skill-files.json"
    a.click()
    URL.revokeObjectURL(url)
  }, [nodes])

  const handleCancel = useCallback(() => {
    if (window.confirm("Are you sure you want to reset? All changes will be lost.")) {
      window.location.reload()
    }
  }, [])

  return (
    <div className="h-screen w-screen overflow-hidden bg-background relative">
      {/* Header */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-4">
        <Link href="/home">
          <h1 className="text-xl font-semibold text-foreground tracking-tight font-sans hover:text-muted-foreground transition-colors">
            skills.ct
          </h1>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="group flex items-center gap-0 h-8 rounded-lg transition-all duration-200 hover:gap-2"
            style={{ width: "fit-content" }}
          >
            <div
              className="flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200"
              style={{ background: "rgba(34,197,94,0.19)", color: "#22c55e" }}
            >
              <Save size={16} />
            </div>
            <span className="text-xs font-mono whitespace-nowrap overflow-hidden transition-all duration-200 max-w-0 opacity-0 group-hover:max-w-32 group-hover:opacity-100 group-hover:pr-3" style={{ color: "#22c55e" }}>
              Save
            </span>
          </button>
          <button
            onClick={handleCancel}
            className="group flex items-center gap-0 h-8 rounded-lg transition-all duration-200 hover:gap-2"
            style={{ width: "fit-content" }}
          >
            <div
              className="flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200"
              style={{ background: "rgba(239,68,68,0.19)", color: "#ef4444" }}
            >
              <XCircle size={16} />
            </div>
            <span className="text-xs font-mono whitespace-nowrap overflow-hidden transition-all duration-200 max-w-0 opacity-0 group-hover:max-w-32 group-hover:opacity-100 group-hover:pr-3" style={{ color: "#ef4444" }}>
              Cancel
            </span>
          </button>
        </div>
      </div>

      {/* Canvas */}
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

      {/* Floating Toolbar */}
      <FloatingToolbar
        onAddReference={handleAddReference}
        onAddAsset={handleAddAsset}
        onAddScript={handleAddScript}
        onFormatText={handleFormatText}
      />
    </div>
  )
}
