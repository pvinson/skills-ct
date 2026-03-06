"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Save, XCircle, AlertTriangle, Download, Copy, Check } from "lucide-react"
import { useNodeStore } from "@/hooks/use-node-store"
import { NodeCanvas } from "@/components/node-canvas"
import { FloatingToolbar } from "@/components/floating-toolbar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"

export default function Home() {
  const router = useRouter()
  const { toast } = useToast()
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // For demo purposes, using a placeholder skill name
  const skillSlug = "current-skill"
  const downloadCommand = `$ npx skills add https://github.com/vercel-labs/skills --skill ${skillSlug}`
  
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

  const handleCancelClick = useCallback(() => {
    setShowCancelDialog(true)
  }, [])

  const handleConfirmCancel = useCallback(() => {
    setShowCancelDialog(false)
    router.push("/home")
  }, [router])

  const handleCopyDownloadLink = useCallback(async () => {
    await navigator.clipboard.writeText(downloadCommand)
    setCopied(true)
    toast({ description: "Link copied to clipboard" })
    setTimeout(() => setCopied(false), 2000)
  }, [downloadCommand, toast])

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
            onClick={handleCancelClick}
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
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleCopyDownloadLink}
                className="group flex items-center gap-0 h-8 rounded-lg transition-all duration-200 hover:gap-2"
                style={{ width: "fit-content" }}
              >
                <div
                  className="flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200"
                  style={{ background: "rgba(59,130,246,0.19)", color: "#3b82f6" }}
                >
                  <Download size={16} />
                </div>
                <span className="text-xs font-mono whitespace-nowrap overflow-hidden transition-all duration-200 max-w-0 opacity-0 group-hover:max-w-32 group-hover:opacity-100 group-hover:pr-3" style={{ color: "#3b82f6" }}>
                  Download
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent 
              side="bottom" 
              className="bg-[#1a1a1a] border border-[#333] p-0 max-w-none"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <code className="text-sm font-mono text-[#9ca3af]">
                  {downloadCommand}
                </code>
                <button
                  onClick={handleCopyDownloadLink}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
            </TooltipContent>
          </Tooltip>
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

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center h-10 w-10 rounded-lg"
                style={{ background: "rgba(239,68,68,0.19)" }}
              >
                <AlertTriangle size={20} style={{ color: "#ef4444" }} />
              </div>
              <DialogTitle>Cancel this skill?</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              Are you sure you want to cancel? A canceled project is not recoverable and all your progress will be permanently lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              onClick={() => setShowCancelDialog(false)}
              className="group flex items-center justify-center gap-2 h-10 px-4 rounded-lg transition-all duration-200 border border-border hover:bg-muted"
            >
              <span className="text-sm font-medium text-foreground">
                Continue this skill
              </span>
            </button>
            <button
              onClick={handleConfirmCancel}
              className="group flex items-center justify-center gap-2 h-10 px-4 rounded-lg transition-all duration-200"
              style={{ background: "rgba(239,68,68,0.19)", color: "#ef4444" }}
            >
              <XCircle size={16} />
              <span className="text-sm font-medium">
                Cancel this skill
              </span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
