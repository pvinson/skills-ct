"use client"

import {
  BookOpen,
  Package,
  FileCode,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Type,
  Bold,
  Italic,
  Code,
  Minus,
  Quote,
  Link,
} from "lucide-react"

interface ToolbarButton {
  icon: React.ReactNode
  label: string
  action: () => void
  color?: string
}

interface ToolbarSection {
  title: string
  buttons: ToolbarButton[]
}

interface FloatingToolbarProps {
  onAddReference: () => void
  onAddAsset: () => void
  onAddScript: () => void
  onFormatText: (format: string) => void
}

export function FloatingToolbar({
  onAddReference,
  onAddAsset,
  onAddScript,
  onFormatText,
}: FloatingToolbarProps) {
  const sections: ToolbarSection[] = [
    {
      title: "Nodes",
      buttons: [
        {
          icon: <BookOpen size={18} />,
          label: "Reference",
          action: onAddReference,
        },
        {
          icon: <Package size={18} />,
          label: "Assets",
          action: onAddAsset,
        },
        {
          icon: <FileCode size={18} />,
          label: "Script",
          action: onAddScript,
        },
      ],
    },
    {
      title: "Format",
      buttons: [
        {
          icon: <Heading1 size={18} />,
          label: "Heading 1",
          action: () => onFormatText("h1"),
        },
        {
          icon: <Heading2 size={18} />,
          label: "Heading 2",
          action: () => onFormatText("h2"),
        },
        {
          icon: <Heading3 size={18} />,
          label: "Heading 3",
          action: () => onFormatText("h3"),
        },
        {
          icon: <Bold size={18} />,
          label: "Bold",
          action: () => onFormatText("bold"),
        },
        {
          icon: <Italic size={18} />,
          label: "Italic",
          action: () => onFormatText("italic"),
        },
        {
          icon: <Code size={18} />,
          label: "Code",
          action: () => onFormatText("code"),
        },
        {
          icon: <List size={18} />,
          label: "Bullet List",
          action: () => onFormatText("ul"),
        },
        {
          icon: <ListOrdered size={18} />,
          label: "Ordered List",
          action: () => onFormatText("ol"),
        },
        {
          icon: <Quote size={18} />,
          label: "Blockquote",
          action: () => onFormatText("blockquote"),
        },
        {
          icon: <Minus size={18} />,
          label: "Divider",
          action: () => onFormatText("hr"),
        },
        {
          icon: <Link size={18} />,
          label: "Link",
          action: () => onFormatText("link"),
        },
        {
          icon: <Type size={18} />,
          label: "Body Text",
          action: () => onFormatText("body"),
        },
      ],
    },

  ]

  return (
    <div className="fixed left-4 top-14 z-50 flex flex-col gap-3">
      {sections.map((section) => (
        <div key={section.title} className="flex flex-col gap-1">
          <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground px-1 mb-0.5">
            {section.title}
          </span>
          {section.buttons.map((button) => (
            <ToolbarButtonItem key={button.label} button={button} />
          ))}
        </div>
      ))}
    </div>
  )
}

function ToolbarButtonItem({ button }: { button: ToolbarButton }) {
  return (
    <button
      onClick={button.action}
      className="group flex items-center gap-0 h-9 rounded-lg transition-all duration-200 hover:gap-2"
      style={{ width: "fit-content" }}
    >
      <div
        className="flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-200"
        style={{
          background: button.color
            ? `${button.color}30`
            : "rgba(255,255,255,0.08)",
          color: button.color || "rgba(255,255,255,0.8)",
        }}
      >
        {button.icon}
      </div>
      <span
        className="text-xs font-mono whitespace-nowrap overflow-hidden transition-all duration-200 max-w-0 opacity-0 group-hover:max-w-32 group-hover:opacity-100 group-hover:pr-3"
        style={{
          color: button.color || "rgba(255,255,255,0.8)",
        }}
      >
        {button.label}
      </span>
    </button>
  )
}
