import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { DbSkill } from "@/lib/supabase/types"
import { dbSkillToSkill } from "@/lib/supabase/types"

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("skills")
      .select("*")
      .order("updated_at", { ascending: false })
    
    if (error) {
      console.error("Error fetching skills:", error)
      return NextResponse.json(
        { error: "Failed to fetch skills" },
        { status: 500 }
      )
    }
    
    const skills = (data as DbSkill[]).map(dbSkillToSkill)
    
    return NextResponse.json(skills)
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { title, name, description, content, fileSize, isGoated } = body
    
    if (!title || !name) {
      return NextResponse.json(
        { error: "Title and name are required" },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabase
      .from("skills")
      .insert({
        title,
        name,
        description: description || null,
        content: content || { nodes: [], connections: [] },
        file_size: fileSize || "0 KB",
        is_goated: isGoated || false,
      })
      .select()
      .single()
    
    if (error) {
      console.error("Error creating skill:", error)
      return NextResponse.json(
        { error: "Failed to create skill" },
        { status: 500 }
      )
    }
    
    const skill = dbSkillToSkill(data as DbSkill)
    
    return NextResponse.json(skill, { status: 201 })
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
