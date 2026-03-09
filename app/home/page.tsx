"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Plus, Download, Calendar, FileText, Eye, Copy, Check, Loader2 } from "lucide-react"
import useSWR from "swr"
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

interface Skill {
  id: string
  title: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  fileSize?: string
  downloads?: number
  isGoated?: boolean
  folderUrl?: string
}

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json())

const SAMPLE_SKILLS: Skill[] = [
  {
    id: "1",
    title: "UX Best Practices",
    name: "ux-best-practices.md",
    description: "Comprehensive guide to user experience design principles, accessibility standards, and usability testing methodologies.",
    createdAt: "2025-11-15",
    updatedAt: "2026-02-28",
    fileSize: "24 KB",
    downloads: 1247,
    isGoated: true,
  },
  {
    id: "2",
    title: "React Component Patterns",
    name: "react-component-patterns.md",
    description: "Modern React patterns including hooks, compound components, render props, and state management best practices.",
    createdAt: "2025-12-01",
    updatedAt: "2026-03-01",
    fileSize: "32 KB",
    downloads: 2156,
    isGoated: true,
  },
  {
    id: "3",
    title: "API Design Guidelines",
    name: "api-design-guidelines.md",
    description: "RESTful API design principles, versioning strategies, error handling patterns, and documentation standards.",
    createdAt: "2026-01-10",
    updatedAt: "2026-02-20",
    fileSize: "18 KB",
    downloads: 893,
    isGoated: false,
  },
  {
    id: "4",
    title: "TypeScript Advanced Types",
    name: "typescript-advanced-types.md",
    description: "Deep dive into TypeScript generics, conditional types, mapped types, and template literal types.",
    createdAt: "2026-02-01",
    updatedAt: "2026-03-05",
    fileSize: "28 KB",
    downloads: 1834,
    isGoated: true,
  },
  {
    id: "5",
    title: "Git Workflow Standards",
    name: "git-workflow-standards.md",
    description: "Branch naming conventions, commit message formats, PR templates, and code review guidelines for teams.",
    createdAt: "2026-01-20",
    updatedAt: "2026-02-15",
    fileSize: "15 KB",
    downloads: 567,
    isGoated: false,
  },
  {
    id: "6",
    title: "CSS Architecture",
    name: "css-architecture.md",
    description: "Scalable CSS methodologies including BEM, CSS-in-JS patterns, design tokens, and responsive design systems.",
    createdAt: "2026-02-10",
    updatedAt: "2026-03-02",
    fileSize: "21 KB",
    downloads: 1102,
    isGoated: false,
  },
  {
    id: "7",
    title: "Testing Strategies",
    name: "testing-strategies.md",
    description: "Unit testing, integration testing, E2E testing approaches with Jest, Testing Library, and Playwright.",
    createdAt: "2026-02-25",
    updatedAt: "2026-03-04",
    fileSize: "26 KB",
    downloads: 789,
    isGoated: false,
  },
  {
    id: "8",
    title: "Performance Optimization",
    name: "performance-optimization.md",
    description: "Web performance metrics, lazy loading, code splitting, caching strategies, and Core Web Vitals optimization.",
    createdAt: "2026-03-01",
    updatedAt: "2026-03-06",
    fileSize: "30 KB",
    downloads: 456,
    isGoated: false,
  },
]

function truncateDescription(description: string, maxLength: number = 120): string {
  if (description.length <= maxLength) return description
  return description.slice(0, maxLength).trim() + "..."
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function SkillCard({ skill }: { skill: Skill }) {
  const router = useRouter()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  
  // Use folderUrl if available (from GitHub), otherwise fallback to skill name
  const skillSlug = skill.name.replace(".md", "")
  const downloadCommand = skill.folderUrl 
    ? `$ npx skills add ${skill.folderUrl}`
    : `$ npx skills add https://github.com/pvinson/skills-ct-storage --skill ${skillSlug}`

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(downloadCommand)
    setCopied(true)
    toast({ description: "Link copied to clipboard" })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleView = () => {
    router.push(`/?skill=${skill.id}`)
  }

  return (
    <Card className="bg-card border-border hover:border-muted-foreground/30 transition-colors duration-200">
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
                  className="flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200 hover:bg-muted"
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
            <button
              onClick={handleView}
              className="flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200 hover:bg-muted"
            >
              <Eye size={16} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {truncateDescription(skill.description)}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {formatDate(skill.updatedAt)}
          </span>
          {skill.fileSize && (
            <span className="flex items-center gap-1">
              <FileText size={12} />
              {skill.fileSize}
            </span>
          )}
          {skill.downloads !== undefined && (
            <span className="flex items-center gap-1">
              <Download size={12} />
              {skill.downloads.toLocaleString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Fetch skills from GitHub via API
  const { data: apiResponse, isLoading, error } = useSWR<{ success: boolean; skills: Skill[] }>(
    "/api/skills",
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  )

  // Combine GitHub skills with sample skills (sample skills shown as fallback/demo)
  const allSkills = useMemo(() => {
    const githubSkills = apiResponse?.skills || []
    // Merge GitHub skills first, then sample skills as fallback
    return [...githubSkills, ...SAMPLE_SKILLS]
  }, [apiResponse])

  const filteredSkills = useMemo(() => {
    let skills = allSkills

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      skills = skills.filter(
        (skill) =>
          skill.title.toLowerCase().includes(query) ||
          skill.name.toLowerCase().includes(query) ||
          skill.description.toLowerCase().includes(query)
      )
    }

    // Filter by tab
    switch (activeTab) {
      case "goated":
        skills = skills.filter((skill) => skill.isGoated)
        break
      default:
        // "all" - no additional filtering
        break
    }

    return skills
  }, [searchQuery, activeTab, allSkills])

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Header */}
      <div className="w-full px-4 py-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <h1 className="text-xl font-semibold text-foreground tracking-tight font-sans hover:text-muted-foreground transition-colors">
              skills.ct
            </h1>
          </Link>
          <Link
            href="/"
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
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
        {/* Intro */}
        <div className="text-center max-w-xl mx-auto flex flex-col gap-2">
          <p className="text-base font-semibold text-white leading-relaxed">
            Agents load specific skills &ldquo;just in time&rdquo; when a task is detected, rather than keeping all instructions in active memory.
          </p>
          <p className="text-base font-semibold text-white leading-relaxed">
            Explore creating and editing agent skills in a node-based interface that helps you adhere to best practices, then publish them for others to use.
          </p>
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
            <SkillGrid skills={filteredSkills} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="goated" className="mt-6">
            <SkillGrid skills={filteredSkills} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function SkillGrid({ skills, isLoading }: { skills: Skill[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (skills.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No skills found matching your search.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {skills.map((skill) => (
        <SkillCard key={skill.id} skill={skill} />
      ))}
    </div>
  )
}
