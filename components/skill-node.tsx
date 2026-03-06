"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { SkillNode as SkillNodeType, Connection } from "@/lib/types"
import { NODE_CONFIGS } from "@/lib/types"
import { MoreVertical, Copy, Type, Lock, Unlock, Trash2, Upload, Link } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface SkillNodeProps {
  node: SkillNodeType
  onUpdate: (id: string, updates: Partial<SkillNodeType>) => void
  onRemove: (id: string) => void
  onDuplicate: (id: string) => void
  onSelect: (id: string) => void
  isSelected: boolean
  onConnectionStart: (nodeId: string, e: React.MouseEvent) => void
  canvasOffset: { x: number; y: number }
  canvasScale: number
  connections: Connection[]
  allNodes: SkillNodeType[]
}

export function SkillNodeComponent({
  node,
  onUpdate,
  onRemove,
  onDuplicate,
  onSelect,
  isSelected,
  onConnectionStart,
  canvasOffset,
  canvasScale,
  connections,
  allNodes,
}: SkillNodeProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef({ x: 0, y: 0, nodeX: 0, nodeY: 0 })
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 })
  const titleInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [lineHeights, setLineHeights] = useState<number[]>([])
  const [scrollTop, setScrollTop] = useState(0)

  const config = NODE_CONFIGS[node.type]
  const hasInput = node.type === "main" || node.type === "reference"
  const hasOutput = node.type !== "main"

  // Get connected node titles for this node
  const connectedNodeTitles = connections
    .filter((c) => c.toNodeId === node.id)
    .map((c) => {
      const fromNode = allNodes.find((n) => n.id === c.fromNodeId)
      return fromNode?.title
    })
    .filter(Boolean) as string[]

  // Function to check if a markdown link reference is valid (connected)
  const isValidReference = useCallback((linkText: string, linkPath: string) => {
    // Extract the filename from the path (e.g., "reference/api.md" -> "api")
    // Match reference/, asset/, assets/, scripts/ paths
    const match = linkPath.match(/(?:reference|assets?|scripts?)\/(.+?)(?:\.[^.]+)?$/)
    if (!match) return true // Not a reference/asset link, don't mark as invalid
    const fileName = match[1]
    return connectedNodeTitles.includes(fileName)
  }, [connectedNodeTitles])

  // Function to render content with invalid references highlighted in red
  const renderHighlightedContent = useCallback(() => {
    const content = node.content
    // Match markdown links: [text](path)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const parts: { text: string; isInvalidRef: boolean }[] = []
    let lastIndex = 0
    let match

    while ((match = linkRegex.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({ text: content.slice(lastIndex, match.index), isInvalidRef: false })
      }
      
      const [fullMatch, linkText, linkPath] = match
      const isRefOrAssetLink = /^(reference|assets?|scripts?)\//.test(linkPath)
      const isInvalid = isRefOrAssetLink && !isValidReference(linkText, linkPath)
      
      parts.push({ text: fullMatch, isInvalidRef: isInvalid })
      lastIndex = match.index + fullMatch.length
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({ text: content.slice(lastIndex), isInvalidRef: false })
    }

    return parts
  }, [node.content, isValidReference])

  // Node dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (
        node.locked ||
        (e.target as HTMLElement).closest(".no-drag") ||
        (e.target as HTMLElement).tagName === "TEXTAREA" ||
        (e.target as HTMLElement).tagName === "INPUT"
      ) {
        if (node.locked) onSelect(node.id)
        return
      }
      e.preventDefault()
      e.stopPropagation()
      onSelect(node.id)
      setIsDragging(true)
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        nodeX: node.x,
        nodeY: node.y,
      }
    },
    [node.id, node.x, node.y, onSelect]
  )

  useEffect(() => {
    if (!isDragging) return
    const handleMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStart.current.x) / canvasScale
      const dy = (e.clientY - dragStart.current.y) / canvasScale
      onUpdate(node.id, {
        x: dragStart.current.nodeX + dx,
        y: dragStart.current.nodeY + dy,
      })
    }
    const handleUp = () => setIsDragging(false)
    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleUp)
    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
    }
  }, [isDragging, canvasScale, node.id, onUpdate])

  // Resize
  const handleResizeDown = useCallback(
    (e: React.MouseEvent) => {
      if (node.locked) return
      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)
      resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        w: node.width,
        h: node.height,
      }
    },
    [node.width, node.height]
  )

  useEffect(() => {
    if (!isResizing) return
    const handleMove = (e: MouseEvent) => {
      const dx = (e.clientX - resizeStart.current.x) / canvasScale
      const dy = (e.clientY - resizeStart.current.y) / canvasScale
      onUpdate(node.id, {
        width: Math.max(300, resizeStart.current.w + dx),
        height: Math.max(200, resizeStart.current.h + dy),
      })
    }
    const handleUp = () => setIsResizing(false)
    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleUp)
    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
    }
  }, [isResizing, canvasScale, node.id, onUpdate])

  // Close menu on click outside
  useEffect(() => {
    if (!showMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showMenu])

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  // Sync scroll between textarea, line numbers, and highlight overlay
  const handleTextareaScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
      setScrollTop(textareaRef.current.scrollTop)
    }
  }, [])

  // Calculate line heights for soft wrapping
  useEffect(() => {
    if (!measureRef.current || node.type === "asset") return
    
    const measure = measureRef.current
    const lines = node.content.split("\n")
    const baseLineHeight = 21 // 14px * 1.5 line-height
    
    const heights = lines.map((line) => {
      if (!line || line.trim() === "") {
        return baseLineHeight
      }
      measure.textContent = line || " "
      const height = measure.offsetHeight
      return height || baseLineHeight
    })
    
    setLineHeights(heights)
  }, [node.content, node.width, node.type])

  return (
    <div
      className="absolute select-none"
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        zIndex: isSelected ? 20 : 10,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Input connector */}
      {hasInput && (
        <div
          className="no-drag absolute flex items-center"
          style={{ left: -8, top: 20 }}
        >
          <span
            className="absolute text-xs text-orange-400 whitespace-nowrap"
            style={{ right: 20 }}
          >
            (input)
          </span>
          <div
            data-connector="input"
            data-node-id={node.id}
            className="h-4 w-4 rounded-full bg-orange-500 border-2 border-orange-300 cursor-crosshair hover:scale-125 transition-transform"
          />
        </div>
      )}

      {/* Output connector */}
      {hasOutput && (
        <div
          className="no-drag absolute flex items-center"
          style={{ right: -8, top: 20 }}
        >
          <div
            data-connector="output"
            data-node-id={node.id}
            className="h-4 w-4 rounded-full bg-orange-500 border-2 border-orange-300 cursor-crosshair hover:scale-125 transition-transform"
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onConnectionStart(node.id, e)
            }}
          />
          <span
            className="absolute text-xs text-orange-400 whitespace-nowrap"
            style={{ left: 20 }}
          >
            (output)
          </span>
        </div>
      )}

      {/* Node body */}
      <div
        className="flex flex-col h-full overflow-hidden"
        style={{
          background: config.bg,
          border: isSelected ? "1px solid #ffffff" : "1px solid rgba(255,255,255,0.6)",
          borderRadius: 16,
          boxShadow: isSelected
            ? "0 0 20px rgba(255,255,255,0.1)"
            : "0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 py-3 ${node.locked ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isEditingTitle ? (
              <div className="no-drag flex items-center">
                <input
                  ref={titleInputRef}
                  className="bg-transparent text-foreground text-sm font-mono outline-none border-b border-foreground/40 w-32"
                  value={node.title}
                  onChange={(e) => onUpdate(node.id, { title: e.target.value })}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setIsEditingTitle(false)
                  }}
                />
                <span className="text-sm font-mono text-muted-foreground">
                  .md
                </span>
              </div>
            ) : (
              <button
                className="no-drag text-sm font-mono text-foreground hover:text-foreground/80 transition-colors truncate"
                onClick={() => setIsEditingTitle(true)}
              >
                {node.title}.md
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {node.locked && (
              <Lock size={12} className="text-orange-400" />
            )}
            {/* Line count meter - only for main node */}
            {node.type === "main" && (() => {
              const lineCount = node.content.split("\n").length
              const percentage = Math.min((lineCount / 500) * 100, 100)
              const getMeterColor = () => {
                if (lineCount <= 150) return "#22c55e" // green
                if (lineCount <= 250) return "#eab308" // yellow
                if (lineCount <= 350) return "#f97316" // orange
                return "#ef4444" // red
              }
              const meterColor = getMeterColor()
              return (
                <div 
                  className="flex items-center gap-1.5"
                  title={`${lineCount} / 500 lines`}
                >
                  {lineCount >= 500 && (
                    <span
                      className="text-xs font-mono"
                      style={{ color: "#ef4444" }}
                    >
                      recommended max lines
                    </span>
                  )}
                  <span
                    className="text-xs font-mono"
                    style={{ color: meterColor }}
                  >
                    {lineCount}
                  </span>
                  <div
                    className="relative overflow-hidden rounded-full"
                    style={{
                      width: 40,
                      height: 6,
                      background: "rgba(255,255,255,0.1)",
                    }}
                  >
                    <div
                      className="absolute left-0 top-0 h-full rounded-full transition-all duration-200"
                      style={{
                        width: `${percentage}%`,
                        background: meterColor,
                      }}
                    />
                  </div>
                </div>
              )
            })()}
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {config.badge}
            </span>
            {node.type !== "main" && (
              <div className="no-drag relative" ref={menuRef}>
                <button
                  className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu((prev) => !prev)
                  }}
                >
                  <MoreVertical size={14} />
                </button>
                {showMenu && (
                  <div
                    className="absolute right-0 top-full mt-1 w-40 rounded-lg overflow-hidden z-40"
                    style={{
                      background: "rgba(30,30,30,0.97)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
<button
                                      className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-mono text-foreground/80 hover:bg-white/10 hover:text-foreground transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onDuplicate(node.id)
                                        setShowMenu(false)
                                      }}
                                    >
                                      <Copy size={13} />
                                      Duplicate
                                    </button>
                                    <button
                                      className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-mono text-foreground/80 hover:bg-white/10 hover:text-foreground transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        const subdirectory = node.type === "reference" ? "reference" : "asset"
                                        const link = `[${node.title}](${subdirectory}/${node.title}.md)`
                                        navigator.clipboard.writeText(link)
                                        toast({
                                          description: "Node link copied",
                                          duration: 6000,
                                        })
                                        setShowMenu(false)
                                      }}
                                    >
                                      <Link size={13} />
                                      Copy link
                                    </button>
                                    <button
                                      className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-mono text-foreground/80 hover:bg-white/10 hover:text-foreground transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setShowMenu(false)
                                        setIsEditingTitle(true)
                                      }}
                                    >
                                      <Type size={13} />
                                      Rename
                                    </button>
                    <button
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-mono text-foreground/80 hover:bg-white/10 hover:text-foreground transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        onUpdate(node.id, { locked: !node.locked })
                        setShowMenu(false)
                      }}
                    >
                      {node.locked ? <Unlock size={13} /> : <Lock size={13} />}
                      {node.locked ? "Unlock" : "Lock"}
                    </button>
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }} />
                    <button
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-mono text-red-400 hover:bg-red-500/15 hover:text-red-300 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(false)
                        setShowRemoveConfirm(true)
                      }}
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-1">
          {node.type === "asset" ? (
            <div className="no-drag flex items-center justify-center w-full h-full">
              <button
                className="flex flex-col items-center gap-3 px-8 py-6 rounded-xl transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px dashed rgba(255,255,255,0.25)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)"
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)"
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"
                }}
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                <Upload size={24} className="text-foreground/50" />
                <span className="text-xs font-mono text-foreground/50">Upload</span>
              </button>
            </div>
          ) : (
            <div className="no-drag node-content-area flex h-full overflow-hidden relative">
              {/* Hidden measurement div for calculating wrapped line heights */}
              <div
                ref={measureRef}
                className="absolute text-sm font-mono p-0"
                style={{
                  visibility: "hidden",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  lineHeight: "1.5",
                  // Match textarea width: full width minus line numbers (2.5rem + padding)
                  width: `calc(${node.width}px - 2.5rem - 24px - 2px)`,
                  padding: "0",
                }}
                aria-hidden="true"
              />
              {/* Line numbers */}
              <div
                ref={lineNumbersRef}
                className="flex-shrink-0 select-none text-right pr-3 pt-3 pb-3 text-xs font-mono text-foreground/30 overflow-hidden"
                style={{
                  minWidth: "2.5rem",
                  borderRight: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {node.content.split("\n").map((_, index) => (
                  <div 
                    key={index}
                    style={{ 
                      height: lineHeights[index] || 21,
                      display: "flex",
                      alignItems: "flex-start",
                      paddingTop: "0px",
                      lineHeight: "1.5",
                    }}
                  >
                    {index + 1}
                  </div>
                ))}
              </div>
              {/* Text content with word wrap */}
              <div className="relative flex-1 w-full h-full">
                {/* Highlight overlay for invalid references */}
                <div
                  className="absolute inset-0 text-sm font-mono p-3 pointer-events-none overflow-hidden"
                  style={{ 
                    lineHeight: "1.5",
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <div
                    style={{
                      transform: `translateY(-${scrollTop}px)`,
                    }}
                  >
                    {renderHighlightedContent().map((part, i) => (
                      <span
                        key={i}
                        style={{ color: part.isInvalidRef ? "#ef4444" : "rgba(255,255,255,0.9)" }}
                      >
                        {part.text}
                      </span>
                    ))}
                  </div>
                </div>
                <textarea
                  ref={textareaRef}
                  className="absolute inset-0 w-full h-full resize-none bg-transparent text-sm font-mono p-3 outline-none"
                  style={{ 
                    caretColor: "white",
                    lineHeight: "1.5",
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                    whiteSpace: "pre-wrap",
                    color: "transparent",
                  }}
                  value={node.content}
                  onChange={(e) => {
                    if (!node.locked) onUpdate(node.id, { content: e.target.value })
                  }}
                  onScroll={handleTextareaScroll}
                  readOnly={node.locked}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect(node.id)
                  }}
                  spellCheck={false}
                  placeholder="Start typing..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Resize handle */}
        <div
          className="no-drag absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize"
          style={{ borderRadius: "0 0 16px 0" }}
          onMouseDown={handleResizeDown}
        >
          <svg
            viewBox="0 0 20 20"
            className="w-full h-full"
            style={{ opacity: 0.3 }}
          >
            <path
              d="M 14 20 L 20 14 M 10 20 L 20 10 M 6 20 L 20 6"
              stroke="white"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        </div>

        {/* Remove confirmation dialog */}
        {showRemoveConfirm && (
          <div
            className="no-drag absolute inset-0 z-30 flex items-center justify-center"
            style={{ borderRadius: 16, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-4 px-6 py-5 rounded-xl" style={{ background: "rgba(30,30,30,0.95)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <p className="text-sm font-mono text-foreground text-center">
                Remove <span className="text-orange-400">{node.title}.md</span>?
              </p>
              <p className="text-xs text-muted-foreground text-center max-w-48">
                This will delete the node and all its connections.
              </p>
              <div className="flex items-center gap-3">
                <button
                  className="px-4 py-1.5 text-xs font-mono rounded-lg transition-colors"
                  style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.18)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)" }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowRemoveConfirm(false)
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-1.5 text-xs font-mono rounded-lg bg-red-600 text-foreground transition-colors hover:bg-red-500"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(node.id)
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
