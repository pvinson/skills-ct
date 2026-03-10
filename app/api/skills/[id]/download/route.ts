import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Increment the download count
    const { data, error } = await supabase
      .rpc("increment_downloads", { skill_id: id })
    
    if (error) {
      // If the RPC doesn't exist, fall back to manual update
      const { error: updateError } = await supabase
        .from("skills")
        .update({ downloads: supabase.rpc("increment", { row_id: id }) })
        .eq("id", id)
      
      if (updateError) {
        // Simple increment fallback
        const { data: skill } = await supabase
          .from("skills")
          .select("downloads")
          .eq("id", id)
          .single()
        
        if (skill) {
          await supabase
            .from("skills")
            .update({ downloads: (skill.downloads || 0) + 1 })
            .eq("id", id)
        }
      }
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
