// GitHub API utility functions for skills-ct-storage repository
// Demo token - in production, use environment variables

const GITHUB_TOKEN = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" // Replace with actual token for demo
const REPO_OWNER = "pvinson"
const REPO_NAME = "skills-ct-storage"
const BASE_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`

interface GitHubFile {
  path: string
  content: string
  encoding?: "utf-8" | "base64"
}

interface GitHubTreeItem {
  path: string
  mode: "100644" | "100755" | "040000" | "160000" | "120000"
  type: "blob" | "tree" | "commit"
  sha?: string
  content?: string
}

async function githubFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(`GitHub API error: ${error.message || response.statusText}`)
  }

  return response.json()
}

export async function getDefaultBranch(): Promise<string> {
  const repo = await githubFetch("")
  return repo.default_branch || "main"
}

export async function getLatestCommitSha(branch: string): Promise<string> {
  const ref = await githubFetch(`/git/refs/heads/${branch}`)
  return ref.object.sha
}

export async function createBlob(content: string, encoding: "utf-8" | "base64" = "utf-8"): Promise<string> {
  const blob = await githubFetch("/git/blobs", {
    method: "POST",
    body: JSON.stringify({ content, encoding }),
  })
  return blob.sha
}

export async function createTree(baseTreeSha: string, files: GitHubFile[]): Promise<string> {
  const tree: GitHubTreeItem[] = await Promise.all(
    files.map(async (file) => {
      const blobSha = await createBlob(file.content, file.encoding || "utf-8")
      return {
        path: file.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blobSha,
      }
    })
  )

  const newTree = await githubFetch("/git/trees", {
    method: "POST",
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree,
    }),
  })

  return newTree.sha
}

export async function createCommit(
  message: string,
  treeSha: string,
  parentSha: string
): Promise<string> {
  const commit = await githubFetch("/git/commits", {
    method: "POST",
    body: JSON.stringify({
      message,
      tree: treeSha,
      parents: [parentSha],
    }),
  })
  return commit.sha
}

export async function updateRef(branch: string, commitSha: string): Promise<void> {
  await githubFetch(`/git/refs/heads/${branch}`, {
    method: "PATCH",
    body: JSON.stringify({
      sha: commitSha,
      force: false,
    }),
  })
}

export async function pushFilesToGitHub(
  skillName: string,
  files: GitHubFile[]
): Promise<string> {
  // Prefix all file paths with the skill folder name
  const prefixedFiles = files.map((file) => ({
    ...file,
    path: `${skillName}/${file.path}`,
  }))

  // Get the default branch and latest commit
  const branch = await getDefaultBranch()
  const latestCommitSha = await getLatestCommitSha(branch)

  // Get the tree SHA from the latest commit
  const commit = await githubFetch(`/git/commits/${latestCommitSha}`)
  const baseTreeSha = commit.tree.sha

  // Create a new tree with the files
  const newTreeSha = await createTree(baseTreeSha, prefixedFiles)

  // Create a new commit
  const commitMessage = `Add skill: ${skillName}`
  const newCommitSha = await createCommit(commitMessage, newTreeSha, latestCommitSha)

  // Update the branch reference
  await updateRef(branch, newCommitSha)

  // Return the folder URL
  return `https://github.com/${REPO_OWNER}/${REPO_NAME}/tree/${branch}/${skillName}`
}

export async function listSkillFolders(): Promise<string[]> {
  try {
    const contents = await githubFetch("/contents")
    return contents
      .filter((item: { type: string; name: string }) => item.type === "dir")
      .map((item: { name: string }) => item.name)
  } catch {
    return []
  }
}

export async function getFileContent(path: string): Promise<string | null> {
  try {
    const file = await githubFetch(`/contents/${path}`)
    if (file.content) {
      return Buffer.from(file.content, "base64").toString("utf-8")
    }
    return null
  } catch {
    return null
  }
}

export interface SkillMetadata {
  id: string
  title: string
  name: string
  description: string
  folderUrl: string
  createdAt: string
  updatedAt: string
}

export async function fetchSkillsFromGitHub(): Promise<SkillMetadata[]> {
  const folders = await listSkillFolders()
  const branch = await getDefaultBranch()

  const skills: SkillMetadata[] = await Promise.all(
    folders.map(async (folderName) => {
      const skillContent = await getFileContent(`${folderName}/SKILL.md`)

      // Parse frontmatter
      let name = folderName
      let description = ""

      if (skillContent) {
        const frontmatterMatch = skillContent.match(/^---\n([\s\S]*?)\n---/)
        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1]
          const nameMatch = frontmatter.match(/name:\s*(.+)/)
          const descMatch = frontmatter.match(/description:\s*(.+)/)
          if (nameMatch) name = nameMatch[1].trim()
          if (descMatch) description = descMatch[1].trim()
        }
      }

      // Create a title from the name (convert kebab-case to Title Case)
      const title = name
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")

      return {
        id: folderName,
        title,
        name: `${folderName}`,
        description: description || `Skill package for ${title}`,
        folderUrl: `https://github.com/${REPO_OWNER}/${REPO_NAME}/tree/${branch}/${folderName}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    })
  )

  return skills
}

export function getSkillFolderUrl(skillName: string, branch: string = "main"): string {
  return `https://github.com/${REPO_OWNER}/${REPO_NAME}/tree/${branch}/${skillName}`
}
