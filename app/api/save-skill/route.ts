import { NextResponse } from "next/server"
import { pushFilesToGitHub } from "@/lib/github"

interface SaveSkillRequest {
  skillName: string
  files: Array<{
    path: string
    content: string
    encoding?: "utf-8" | "base64"
  }>
}

export async function POST(request: Request) {
  try {
    const body: SaveSkillRequest = await request.json()
    const { skillName, files } = body

    if (!skillName || !files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing skillName or files" },
        { status: 400 }
      )
    }

    // Push files to GitHub
    const folderUrl = await pushFilesToGitHub(skillName, files)

    return NextResponse.json({
      success: true,
      folderUrl,
      message: `Skill "${skillName}" saved successfully`,
    })
  } catch (error) {
    console.error("Error saving skill to GitHub:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save skill",
      },
      { status: 500 }
    )
  }
}
