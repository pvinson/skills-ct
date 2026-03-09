export type NodeType = "main" | "reference" | "asset" | "script" | "readme"

export interface SkillNode {
  id: string
  type: NodeType
  x: number
  y: number
  width: number
  height: number
  title: string
  extension: string
  content: string
  locked: boolean
  // Asset-specific properties
  assetFile?: {
    name: string
    type: string
    dataUrl: string
  }
}

export interface Connection {
  id: string
  fromNodeId: string
  toNodeId: string
}

export const NODE_CONFIGS: Record<
  NodeType,
  {
    bg: string
    badge: string
    defaultTitle: string
    defaultExtension: string
    defaultContent: string
  }
> = {
  main: {
    bg: "#111111",
    badge: "main",
    defaultTitle: "skill",
    defaultExtension: "md",
    defaultContent: `---
name: your-skill-name
description: This skill should be used when the user asks to "specific phrase 1" or "specific phrase 2".
---

# Skill Goal
A brief statement of what this skill achieves (e.g., "Standardize React Component creation").

## Constraints & Guardrails
- **Rule 1**: Never use…
- **Rule 2**: Do not run…
- **Rule 3**: Use only …

## Instructions & Workflow
1. **Step 1 Name**: Examine the…
2. **Step 2 Name**: Draft a…
3. **Step 3 Name**: Implement…using the [Reference Name](reference/reference-name.md).

## Examples
- **Example 1 Name**: [Example code or expected behavior goes here]
- **Example 2 Name**: [Example code or expected behavior goes here]

## References
- [Reference Name](reference/reference-name.md)
- [Asset Name](assets/asset-name.ttf)
- [Asset Name](assets/asset-name.png)
- [Script Name](scripts/script-name.py)
- [Script Name](scripts/script-name.js)
`,
  },
  reference: {
    bg: "#222222",
    badge: "reference",
    defaultTitle: "reference",
    defaultExtension: "md",
    defaultContent: `# [Resource Name] Reference

> **Context:** Brief 1-sentence description of what this data is (e.g., "Standard API error codes and resolution steps for the Billing Skill").

---

## Table of Contents
- [Summary](#summary)
- [Core Data/Specifications](#core-data-specifications)
- [Edge Cases & Constraints](#edge-cases--constraints)
- [Version & Maintenance](#version--maintenance)

---

## Summary
Provide a high-level overview here. If this file contains a large dataset, summarize the **schema** or **structure** so the agent knows what kind of questions this file can answer.

## Core Data / Specifications
This is the primary section the agent will pull from.
- Use **Bullet Points** for high scannability.
- Use **Tables** for mapping values (e.g., Error Code | Message | Fix).
- Use **Code Blocks** for technical snippets or regex patterns.

| Key Identifier | Description | Required Action |
| :--- | :--- | :--- |
| \`{PLACEHOLDER_1}\` | Description of the data point | Step to take |
| \`{PLACEHOLDER_2}\` | Description of the data point | Step to take |

## Edge Cases & Constraints
List any specific "gotchas" or limitations found in this data.
- **Constraint:** "Data in this file is only valid for Python 3.10+".
- **Warning:** "Do not use these values for production environments."

## References
- [Reference Name](reference/reference-name.md)
- [Asset Name](assets/asset-name.ttf)
- [Asset Name](assets/asset-name.png)
- [Script Name](scripts/script-name.py)
- [Script Name](scripts/script-name.js)
`,
  },
  asset: {
    bg: "#333333",
    badge: "asset",
    defaultTitle: "asset",
    defaultExtension: "png",
    defaultContent: ``,
  },
  script: {
    bg: "#EEEEEE",
    badge: "script",
    defaultTitle: "script",
    defaultExtension: "txt",
    defaultContent: ``,
  },
  readme: {
    bg: "#1a1a2e",
    badge: "readme",
    defaultTitle: "readme",
    defaultExtension: "md",
    defaultContent: `# General Duidelines

* Be narrowly scoped and goal-oriented: Each skill should target a specific type of task (e.g., "Generating PDFs in Python" or "Writing secure Express.js APIs") with a clear purpose and expected outputs.

* Lead with constraints and pitfalls: Start with what must or must not happen (security risks, performance traps, environment limits, forbidden libraries, style rules) so the agent avoids common failures.

* Use concrete, minimal examples: Include small, copy-safe snippets that demonstrate typical usage patterns, file layouts, and calling conventions instead of abstract advice.

* Describe the runtime environment explicitly: Document language versions, available tools/libraries, network and filesystem constraints, and any pre-existing directory structure.

* Standardize structure and formatting: Use a consistent, predictable layout (e.g., intro, do/don't list, step-by-step patterns, examples, testing tips, edge cases) and simple, skimmable markdown.

* Optimize for machine parsing: Prefer clear headings, bullet lists, and stable terminology over prose; avoid ambiguity and contradictory guidance.

* Include validation and testing guidance: Specify how the agent should verify correctness (test commands, linters, sample inputs/outputs, acceptance criteria).

* Keep it stable and versioned: Version skill files, note breaking changes, and avoid frequent redefinition of the same concepts; deprecate older patterns clearly rather than silently replacing them.

# Skill.md Guidelines
* SKILL.md files must begin with YAML frontmatter, which is loaded by default into the SKILLmd node, which must include both a name and a description: 

---
name: your-skill-name
description: This skill should be used when the user asks to "specific phrase 1" or "specific phrase 2".
---

* Try to keep the main SKILL.md to 500 words or less, ideally as short as possible, since it will be permanently loaded into context; this keeps core guidance always available without wasting tokens.

* Treat SKILL.md as a high-signal summary of rules and patterns, not a tutorial: focus on must / must-not rules, key constraints, and 1-2 canonical patterns.

* Put extended explanations, edge cases, and large examples into separate REFERENCE.md files that the agent can open on demand.

* Use tight, skimmable sections with consistent headings, for example:
    * # Skill Goal (1-2 sentences max)
    * # When to Use (short bullets)
    * # Constraints (critical Must Not rules only,)
    * # Instructions (step-by-step workflow)
    * # Examples (such as what inputs or outputs should look like)
    * # References (list the REFERENCE.md files and what they cover).

* Prefer bullets and numbered steps over long paragraphs; each bullet should capture one actionable rule or pattern.

* Keep line lengths reasonable (roughly 100-120 characters) and use consistent terminology across all associated files so agents can learn and scan the structure quickly.

# Reference.md Guidelines

* Use REFERENCE.md files for deeper, optional detail: long examples, extended edge cases, language-specific variants, or troubleshooting guides.

* Avoid nested reference chains: do not create REFERENCE-A.md that tells the agent to open REFERENCE-B.md, which then points to REFERENCE-C.md. Each reference file should be self-contained or point back only to SKILL.md.

* If you need multiple references, fan out from SKILL.md (e.g., REFERENCE-python.md, REFERENCE-js.md, REFERENCE-examples.md) rather than creating multi-hop hierarchies.

* When cross-linking is unavoidable, keep it shallow and explicit (at most one additional hop) and clearly explain why another file is needed.

# Asset Guidelines

* Keep assets minimal and generic: Only include files that are broadly reusable (e.g., base templates, common config stubs, small example datasets), not project-specific artifacts.

* Use clear, stable naming, and reference these paths explicitly in SKILL.md so agents know where to look.

* Avoid large or binary assets unless essential; they increase token and storage costs and are harder for agents to reason about. Prefer small, text-based assets.

* Make assets idempotent and safe to reuse: Design templates and fixtures so they can be used multiple times without side effects (e.g., use placeholder values, avoid hard-coded paths).

#Script Guidelines

* Prefer small, single-purpose scripts over large, multipurpose ones (e.g., generate_report.py, validate_output.sh), each with a clear, documented interface.

* Document invocation clearly in SKILL.md or a short script header comment: required args, optional flags, environment assumptions, and example commands.

* Fail loudly and predictably: Use clear exit codes and error messages so agents can detect and react to failures programmatically.

* Avoid hidden side effects: Scripts should not silently modify unrelated files, change global config, or require manual interaction; keep them non-interactive and deterministic.

* Keep dependencies explicit and minimal: Note any required tools or libraries; avoid pulling in heavy stacks when a simpler approach works, and align with the documented runtime environment.
`,
  },
}
