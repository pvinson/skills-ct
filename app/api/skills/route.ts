import { NextResponse } from "next/server"
import { fetchSkillsFromGitHub } from "@/lib/github"

export async function GET() {
  try {
    const skills = await fetchSkillsFromGitHub()

    return NextResponse.json({
      success: true,
      skills,
    })
  } catch (error) {
    console.error("Error fetching skills from GitHub:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch skills",
        skills: [],
      },
      { status: 500 }
    )
  }
}
