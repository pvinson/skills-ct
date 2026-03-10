"use client"

import { useCallback, useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Save, XCircle, AlertTriangle, Download, Copy, Check, Upload, Loader2 } from "lucide-react"
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
import type { Skill, SkillContent } from "@/lib/supabase/types"

function EditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentSkillId, setCurrentSkillId] = useState<string | null>(null)
  
  const skillId = searchParams.get("skill")
  
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
    loadSkillContent,
  } = useNodeStore()

  // Get the main node for naming
  const mainNode = nodes.find((node) => node.type === "main")
  const skillSlug = mainNode?.title || "current-skill"
  const downloadCommand = `$ npx skills add https://github.com/pvinson/skills-ct-storage --skill ${skillSlug}`

  // Load skill from database if skill ID is provided
  useEffect(() => {
    async function loadSkill() {
      if (!skillId) return
      
      setLoading(true)
      try {
        const response = await fetch(`/api/skills/${skillId}`)
        if (response.ok) {
          const skill: Skill = await response.json()
          setCurrentSkillId(skill.id)
          
          // Load skill content into the node store
          if (skill.content && skill.content.nodes && skill.content.nodes.length > 0) {
            loadSkillContent(skill.content)
          }
        } else {
          toast({ 
            description: "Failed to load skill", 
            variant: "destructive" 
          })
        }
      } catch (error) {
        console.error("Error loading skill:", error)
        toast({ 
          description: "Failed to load skill", 
          variant: "destructive" 
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadSkill()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillId])



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

  // Calculate file size based on content
  const calculateFileSize = useCallback(() => {
    const totalBytes = nodes.reduce((acc, node) => {
      return acc + new Blob([node.content]).size
    }, 0)
    
    if (totalBytes < 1024) return `${totalBytes} B`
    if (totalBytes < 1024 * 1024) return `${Math.round(totalBytes / 1024)} KB`
    return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
  }, [nodes])

  // Extract description from main node YAML frontmatter
  const extractDescription = useCallback(() => {
    const mainNode = nodes.find((n) => n.type === "main")
    if (!mainNode) return ""
    
    const content = mainNode.content
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
    if (!frontmatterMatch) return ""
    
    const frontmatter = frontmatterMatch[1]
    const descMatch = frontmatter.match(/description:\s*(.+)/)
    return descMatch ? descMatch[1].trim() : ""
  }, [nodes])

  const handleSaveToDatabase = useCallback(async () => {
    setSaving(true)
    
    try {
      const mainNode = nodes.find((n) => n.type === "main")
      const skillContent: SkillContent = { nodes, connections }
      
      const skillData = {
        title: mainNode?.title || "Untitled Skill",
        name: `${mainNode?.title || "skill"}.md`,
        description: extractDescription(),
        content: skillContent,
        fileSize: calculateFileSize(),
      }
      
      let response: Response
      
      if (currentSkillId) {
        // Update existing skill
        response = await fetch(`/api/skills/${currentSkillId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(skillData),
        })
      } else {
        // Create new skill
        response = await fetch("/api/skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(skillData),
        })
      }
      
      if (response.ok) {
        const savedSkill = await response.json()
        setCurrentSkillId(savedSkill.id)
        toast({ description: "Skill saved successfully!" })
        
        // Update URL with skill ID for new skills
        if (!currentSkillId) {
          router.replace(`/editor?skill=${savedSkill.id}`)
        }
      } else {
        throw new Error("Failed to save skill")
      }
    } catch (error) {
      console.error("Error saving skill:", error)
      toast({ 
        description: "Failed to save skill", 
        variant: "destructive" 
      })
    } finally {
      setSaving(false)
    }
  }, [nodes, connections, currentSkillId, calculateFileSize, extractDescription, toast, router])

  const handleDownloadLocal = useCallback(() => {
    // Build all files data
    const files = nodes.map((node) => ({
      filename: `${node.title}.md`,
      type: node.type,
      content: node.content,
    }))

    // Get the skill.md node's title for the filename
    const mainNode = nodes.find((node) => node.type === "main")
    const skillName = mainNode?.title || "skill-files"

    // Download as JSON bundle
    const blob = new Blob([JSON.stringify(files, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${skillName}.json`
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

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background relative">
      {/* Header */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-4">
        <button onClick={handleCancelClick}>
          <h1 className="text-xl font-semibold text-foreground tracking-tight font-sans hover:text-muted-foreground transition-colors">
            skills.ct
          </h1>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveToDatabase}
            disabled={saving}
            className="group flex items-center gap-0 h-8 rounded-lg transition-all duration-200 hover:gap-2 disabled:opacity-50"
            style={{ width: "fit-content" }}
          >
            <div
              className="flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200"
              style={{ background: "rgba(34,197,94,0.19)", color: "#22c55e" }}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            </div>
            <span className="text-xs font-mono whitespace-nowrap overflow-hidden transition-all duration-200 max-w-0 opacity-0 group-hover:max-w-32 group-hover:opacity-100 group-hover:pr-3" style={{ color: "#22c55e" }}>
              {currentSkillId ? "Update" : "Publish"}
            </span>
          </button>
          <button
            onClick={handleDownloadLocal}
            className="group flex items-center gap-0 h-8 rounded-lg transition-all duration-200 hover:gap-2"
            style={{ width: "fit-content" }}
          >
            <div
              className="flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200"
              style={{ background: "rgba(59,130,246,0.19)", color: "#3b82f6" }}
            >
              <Save size={16} />
            </div>
            <span className="text-xs font-mono whitespace-nowrap overflow-hidden transition-all duration-200 max-w-0 opacity-0 group-hover:max-w-32 group-hover:opacity-100 group-hover:pr-3" style={{ color: "#3b82f6" }}>
              Export
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
          {currentSkillId && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleCopyDownloadLink}
                  className="group flex items-center gap-0 h-8 rounded-lg transition-all duration-200 hover:gap-2"
                  style={{ width: "fit-content" }}
                >
                  <div
                    className="flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200"
                    style={{ background: "rgba(168,85,247,0.19)", color: "#a855f7" }}
                  >
                    <Download size={16} />
                  </div>
                  <span className="text-xs font-mono whitespace-nowrap overflow-hidden transition-all duration-200 max-w-0 opacity-0 group-hover:max-w-32 group-hover:opacity-100 group-hover:pr-3" style={{ color: "#a855f7" }}>
                    Share
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
          )}
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

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
      </div>
    }>
      <EditorContent />
    </Suspense>
  )
}
