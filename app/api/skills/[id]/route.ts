import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { DbSkill } from "@/lib/supabase/types"
import { dbSkillToSkill } from "@/lib/supabase/types"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("skills")
      .select("*")
      .eq("id", id)
      .single()
    
    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Skill not found" },
          { status: 404 }
        )
      }
      console.error("Error fetching skill:", error)
      return NextResponse.json(
        { error: "Failed to fetch skill" },
        { status: 500 }
      )
    }
    
    const skill = dbSkillToSkill(data as DbSkill)
    
    return NextResponse.json(skill)
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()
    
    const updates: Record<string, unknown> = {}
    
    if (body.title !== undefined) updates.title = body.title
    if (body.name !== undefined) updates.name = body.name
    if (body.description !== undefined) updates.description = body.description
    if (body.content !== undefined) updates.content = body.content
    if (body.fileSize !== undefined) updates.file_size = body.fileSize
    if (body.isGoated !== undefined) updates.is_goated = body.isGoated
    
    const { data, error } = await supabase
      .from("skills")
      .update(updates)
      .eq("id", id)
      .select()
      .single()
    
    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Skill not found" },
          { status: 404 }
        )
      }
      console.error("Error updating skill:", error)
      return NextResponse.json(
        { error: "Failed to update skill" },
        { status: 500 }
      )
    }
    
    const skill = dbSkillToSkill(data as DbSkill)
    
    return NextResponse.json(skill)
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { error } = await supabase
      .from("skills")
      .delete()
      .eq("id", id)
    
    if (error) {
      console.error("Error deleting skill:", error)
      return NextResponse.json(
        { error: "Failed to delete skill" },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
