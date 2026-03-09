"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Save, XCircle, AlertTriangle, Download, Copy, Check, Loader2 } from "lucide-react"
import { useNodeStore } from "@/hooks/use-node-store"
import type { SkillNode } from "@/lib/types"
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

// Helper to extract skill name from frontmatter
function extractSkillName(node: SkillNode | undefined): string | null {
  if (!node?.content) return null
  const frontmatterMatch = node.content.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) return null
  const nameMatch = frontmatterMatch[1].match(/name:\s*(.+)/)
  return nameMatch ? nameMatch[1].trim() : null
}

// Helper to extract description from frontmatter  
function extractDescription(node: SkillNode | undefined): string {
  if (!node?.content) return ""
  const frontmatterMatch = node.content.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) return ""
  const descMatch = frontmatterMatch[1].match(/description:\s*(.+)/)
  return descMatch ? descMatch[1].trim() : ""
}

// Helper to build folder structure from nodes
function buildSkillFiles(nodes: SkillNode[], skillName: string): Array<{ path: string; content: string; encoding?: "utf-8" | "base64" }> {
  const files: Array<{ path: string; content: string; encoding?: "utf-8" | "base64" }> = []

  for (const node of nodes) {
    // Skip readme nodes - they're just guidelines
    if (node.type === "readme") continue

    switch (node.type) {
      case "main":
        files.push({
          path: "SKILL.md",
          content: node.content,
          encoding: "utf-8",
        })
        break

      case "reference": {
        // Sanitize title for filename
        const refTitle = node.title.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase()
        files.push({
          path: `references/REFERENCE-${refTitle}.md`,
          content: node.content,
          encoding: "utf-8",
        })
        break
      }

      case "asset": {
        const assetTitle = node.title.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase()
        const extension = node.extension || "png"
        
        if (node.assetFile?.dataUrl) {
          // Extract base64 content from data URL
          const base64Content = node.assetFile.dataUrl.split(",")[1] || ""
          files.push({
            path: `assets/${assetTitle}.${extension}`,
            content: base64Content,
            encoding: "base64",
          })
        } else if (node.content) {
          // Text-based asset
          files.push({
            path: `assets/${assetTitle}.${extension}`,
            content: node.content,
            encoding: "utf-8",
          })
        }
        break
      }

      case "script": {
        const scriptTitle = node.title.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase()
        const extension = node.extension || "py"
        files.push({
          path: `scripts/${scriptTitle}.${extension}`,
          content: node.content,
          encoding: "utf-8",
        })
        break
      }
    }
  }

  return files
}

export default function Home() {
  const router = useRouter()
  const { toast } = useToast()
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedSkillUrl, setSavedSkillUrl] = useState<string | null>(null)
  
  // Get skill name from main node for download command
  const { nodes } = useNodeStore()
  const mainNode = nodes.find((n) => n.type === "main")
  const skillSlug = extractSkillName(mainNode) || "current-skill"
  const downloadCommand = savedSkillUrl 
    ? `$ npx skills add ${savedSkillUrl}`
    : `$ npx skills add https://github.com/pvinson/skills-ct-storage --skill ${skillSlug}`
  
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
      // Don't allow formatting on readme nodes
      if (node.type === "readme") return

      // Find the specific textarea within the selected node
      const allTextareas = document.querySelectorAll("textarea")
      let activeTextarea: HTMLTextAreaElement | null = null
      allTextareas.forEach((ta) => {
        if (document.activeElement === ta) {
          activeTextarea = ta
        }
      })

      if (!activeTextarea) {
        // If no textarea focused, apply to the selected node's content (append new line)
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
      const hasSelection = start !== end
      const selectedText = activeTextarea.value.substring(start, end)
      let replacement = ""
      let cursorOffset = 0
      let newCursorStart = start
      let newCursorEnd = start

      if (hasSelection) {
        // TEXT IS SELECTED: Apply formatting to the selected text
        // For line-based formats, apply to each line individually
        const lines = selectedText.split("\n")
        const isMultiLine = lines.length > 1
        
        // Line-based formats that should be applied to each line
        const lineBasedFormats = ["h1", "h2", "h3", "ul", "ol", "blockquote"]
        
        if (isMultiLine && lineBasedFormats.includes(format)) {
          // Apply format to each line
          const formatPrefixes: Record<string, string> = {
            h1: "# ",
            h2: "## ",
            h3: "### ",
            ul: "- ",
            ol: "1. ",
            blockquote: "> ",
          }
          const prefix = formatPrefixes[format]
          replacement = lines.map((line) => `${prefix}${line}`).join("\n")
          newCursorStart = start
          newCursorEnd = start + replacement.length
        } else {
          // Single line or non-line-based format
          switch (format) {
            case "h1":
              replacement = `# ${selectedText}`
              newCursorStart = start
              newCursorEnd = start + replacement.length
              break
            case "h2":
              replacement = `## ${selectedText}`
              newCursorStart = start
              newCursorEnd = start + replacement.length
              break
            case "h3":
              replacement = `### ${selectedText}`
              newCursorStart = start
              newCursorEnd = start + replacement.length
              break
            case "bold":
              replacement = `**${selectedText}**`
              newCursorStart = start
              newCursorEnd = start + replacement.length
              break
            case "italic":
              replacement = `_${selectedText}_`
              newCursorStart = start
              newCursorEnd = start + replacement.length
              break
            case "code":
              replacement = `\`${selectedText}\``
              newCursorStart = start
              newCursorEnd = start + replacement.length
              break
            case "ul":
              replacement = `- ${selectedText}`
              newCursorStart = start
              newCursorEnd = start + replacement.length
              break
            case "ol":
              replacement = `1. ${selectedText}`
              newCursorStart = start
              newCursorEnd = start + replacement.length
              break
            case "blockquote":
              replacement = `> ${selectedText}`
              newCursorStart = start
              newCursorEnd = start + replacement.length
              break
            case "hr":
              replacement = `\n---\n${selectedText}`
              newCursorStart = start
              newCursorEnd = start + replacement.length
              break
            case "link":
              replacement = `[${selectedText}](url)`
              // Position cursor at "url" for easy replacement
              newCursorStart = start + selectedText.length + 3
              newCursorEnd = start + selectedText.length + 6
              break
            case "body":
              replacement = selectedText
              newCursorStart = start
              newCursorEnd = start + replacement.length
              break
            default:
              replacement = selectedText
              newCursorEnd = start + replacement.length
          }
        }

        const newContent =
          activeTextarea.value.substring(0, start) +
          replacement +
          activeTextarea.value.substring(end)
        updateNode(selectedNodeId, { content: newContent })

        // Restore cursor/selection position
        requestAnimationFrame(() => {
          activeTextarea!.focus()
          activeTextarea!.setSelectionRange(newCursorStart, newCursorEnd)
        })
      } else {
        // NO TEXT SELECTED: Add a new line with the markdown element (current behavior)
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
        replacement = formatMap[format] || ""
        
        // Insert at cursor position
        const newContent =
          activeTextarea.value.substring(0, start) +
          replacement +
          activeTextarea.value.substring(end)
        updateNode(selectedNodeId, { content: newContent })

        // Position cursor appropriately
        requestAnimationFrame(() => {
          activeTextarea!.focus()
          const pos = start + replacement.length
          activeTextarea!.setSelectionRange(pos, pos)
        })
      }
    },
    [selectedNodeId, nodes, updateNode]
  )

  const handleSave = useCallback(async () => {
    // Find the main node and extract skill name
    const mainNode = nodes.find((n) => n.type === "main")
    const skillName = extractSkillName(mainNode)

    if (!skillName) {
      toast({
        title: "Error",
        description: "Please set a skill name in the SKILL.md frontmatter (name: your-skill-name)",
        variant: "destructive",
      })
      return
    }

    // Validate skill name format
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(skillName)) {
      toast({
        title: "Invalid skill name",
        description: "Skill name must be lowercase letters, numbers, and hyphens only (e.g., 'my-skill-name')",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      // Build the folder structure
      const files = buildSkillFiles(nodes, skillName)

      if (files.length === 0) {
        toast({
          title: "No files to save",
          description: "Please add some content to your skill before saving.",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      // Call the save API
      const response = await fetch("/api/save-skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillName, files }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to save skill")
      }

      // Update the saved skill URL for the download button
      setSavedSkillUrl(result.folderUrl)

      // Show success toast with clickable link
      toast({
        title: "Skill saved successfully!",
        description: `This skill has been saved to ${result.folderUrl}`,
      })

      // Redirect to homepage after a short delay
      setTimeout(() => {
        router.push("/home")
      }, 2000)

    } catch (error) {
      console.error("Error saving skill:", error)
      toast({
        title: "Failed to save skill",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [nodes, toast, router])

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
            disabled={isSaving}
            className="group flex items-center gap-0 h-8 rounded-lg transition-all duration-200 hover:gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ width: "fit-content" }}
          >
            <div
              className="flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200"
              style={{ background: "rgba(34,197,94,0.19)", color: "#22c55e" }}
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            </div>
            <span className="text-xs font-mono whitespace-nowrap overflow-hidden transition-all duration-200 max-w-0 opacity-0 group-hover:max-w-32 group-hover:opacity-100 group-hover:pr-3" style={{ color: "#22c55e" }}>
              {isSaving ? "Saving..." : "Save"}
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
