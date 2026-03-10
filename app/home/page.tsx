"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Plus, Download, Calendar, FileText, Copy, Check, FolderInput, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import type { Skill } from "@/lib/supabase/types"

function truncateDescription(description: string, maxLength: number = 120): string {
  if (description.length <= maxLength) return description
  return description.slice(0, maxLength).trim() + "..."
}

function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${months[month - 1]} ${day}, ${year}`
}

function SkillCard({ skill }: { skill: Skill }) {
  const router = useRouter()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  
  const skillSlug = skill.name.replace(".md", "")
  const downloadCommand = `$ npx skills add https://github.com/pvinson/skills-ct-storage --skill ${skillSlug}`

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(downloadCommand)
    setCopied(true)
    toast({ description: "Link copied to clipboard" })
    
    // Track download
    try {
      await fetch(`/api/skills/${skill.id}/download`, { method: "POST" })
    } catch {
      // Ignore download tracking errors
    }
    
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCardClick = () => {
    router.push(`/editor?skill=${skill.id}`)
  }

  return (
    <Card
      onClick={handleCardClick}
      className="bg-card border-border hover:border-muted-foreground/30 hover:bg-[#222222] transition-colors duration-200 flex flex-col h-full cursor-pointer"
      style={{ transitionTimingFunction: "ease" }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold text-foreground">
              {skill.title}
            </CardTitle>
            <CardDescription className="font-mono text-xs text-muted-foreground">
              {skill.name}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center h-8 w-8 rounded-lg transition-colors duration-200 hover:bg-[#333333]"
                  style={{ transitionTimingFunction: "ease" }}
                >
                  <Download size={16} className="text-muted-foreground" />
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
                    onClick={handleCopy}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 justify-end gap-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {truncateDescription(skill.description)}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {formatDate(skill.updatedAt)}
          </span>
          <span className="flex items-center gap-1">
            <FileText size={12} />
            {skill.fileSize}
          </span>
          <span className="flex items-center gap-1">
            <Download size={12} />
            {skill.downloads.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch skills from the database
  useEffect(() => {
    async function fetchSkills() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch("/api/skills")
        
        if (!response.ok) {
          throw new Error("Failed to fetch skills")
        }
        
        const data = await response.json()
        setSkills(data)
      } catch (err) {
        console.error("Error fetching skills:", err)
        setError("Failed to load skills. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    
    fetchSkills()
  }, [])

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      sessionStorage.setItem("importedSkillContent", content)
      sessionStorage.setItem("importedSkillFileName", file.name)
      router.push("/editor")
    }
    reader.readAsText(file)
    // Reset input so the same file can be re-selected if needed
    e.target.value = ""
  }

  const filteredSkills = useMemo(() => {
    let filtered = skills

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (skill) =>
          skill.title.toLowerCase().includes(query) ||
          skill.name.toLowerCase().includes(query) ||
          skill.description.toLowerCase().includes(query)
      )
    }

    // Filter by tab
    switch (activeTab) {
      case "goated":
        filtered = filtered.filter((skill) => skill.isGoated)
        break
      default:
        // "all" - no additional filtering
        break
    }

    return filtered
  }, [skills, searchQuery, activeTab])

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Header */}
      <div className="w-full px-4 py-4">
        <div className="flex items-center gap-4">
          <Link href="/home">
            <h1 className="text-xl font-semibold text-foreground tracking-tight font-sans hover:text-muted-foreground transition-colors">
              skills.ct
            </h1>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/editor"
              className="group flex items-center gap-0 h-8 rounded-lg transition-all duration-200 hover:gap-2"
            >
              <div
                className="flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200"
                style={{ background: "rgba(59,130,246,0.19)", color: "#3b82f6" }}
              >
                <Plus size={16} />
              </div>
              <span className="text-xs font-mono whitespace-nowrap overflow-hidden transition-all duration-200 max-w-0 opacity-0 group-hover:max-w-32 group-hover:opacity-100 group-hover:pr-3" style={{ color: "#3b82f6" }}>
                New Skill
              </span>
            </Link>
            <button
              onClick={handleImportClick}
              className="group flex items-center gap-0 h-8 rounded-lg transition-all duration-200 hover:gap-2"
            >
              <div
                className="flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200"
                style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}
              >
                <FolderInput size={16} />
              </div>
              <span className="text-xs font-mono whitespace-nowrap overflow-hidden transition-all duration-200 max-w-0 opacity-0 group-hover:max-w-36 group-hover:opacity-100 group-hover:pr-3" style={{ color: "#22c55e" }}>
                Import Skill
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
        {/* Intro */}
        <div className="text-center w-full flex flex-col gap-2 mb-4">
          <h1 className="text-2xl font-light text-muted-foreground leading-relaxed text-balance font-mono">
            Create and share agent skills in a node-based interface that helps you adhere to best practices.
          </h1>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-xl mx-auto">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full"
          />
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="flex justify-center">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="goated">Goated</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-6">
            <SkillGrid skills={filteredSkills} loading={loading} error={error} />
          </TabsContent>
          <TabsContent value="goated" className="mt-6">
            <SkillGrid skills={filteredSkills} loading={loading} error={error} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function SkillGrid({ skills, loading, error }: { skills: Skill[]; loading: boolean; error: string | null }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        {error}
      </div>
    )
  }

  if (skills.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No skills found. Create your first skill to get started!
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
      {skills.map((skill) => (
        <SkillCard key={skill.id} skill={skill} />
      ))}
    </div>
  )
}
