import type { SkillNode, Connection } from "@/lib/types"

export interface SkillContent {
  nodes: SkillNode[]
  connections: Connection[]
}

export interface DbSkill {
  id: string
  title: string
  name: string
  description: string | null
  content: SkillContent
  file_size: string
  downloads: number
  is_goated: boolean
  created_at: string
  updated_at: string
}

export interface Skill {
  id: string
  title: string
  name: string
  description: string
  content: SkillContent
  fileSize: string
  downloads: number
  isGoated: boolean
  createdAt: string
  updatedAt: string
}

// Convert database row to application model
export function dbSkillToSkill(dbSkill: DbSkill): Skill {
  return {
    id: dbSkill.id,
    title: dbSkill.title,
    name: dbSkill.name,
    description: dbSkill.description || "",
    content: dbSkill.content,
    fileSize: dbSkill.file_size,
    downloads: dbSkill.downloads,
    isGoated: dbSkill.is_goated,
    createdAt: dbSkill.created_at.split("T")[0],
    updatedAt: dbSkill.updated_at.split("T")[0],
  }
}

// Convert application model to database row
export function skillToDbSkill(skill: Partial<Skill>): Partial<DbSkill> {
  const dbSkill: Partial<DbSkill> = {}
  
  if (skill.title !== undefined) dbSkill.title = skill.title
  if (skill.name !== undefined) dbSkill.name = skill.name
  if (skill.description !== undefined) dbSkill.description = skill.description
  if (skill.content !== undefined) dbSkill.content = skill.content
  if (skill.fileSize !== undefined) dbSkill.file_size = skill.fileSize
  if (skill.downloads !== undefined) dbSkill.downloads = skill.downloads
  if (skill.isGoated !== undefined) dbSkill.is_goated = skill.isGoated
  
  return dbSkill
}
