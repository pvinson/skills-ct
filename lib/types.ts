export type NodeType = "main" | "reference" | "asset"

export interface SkillNode {
  id: string
  type: NodeType
  x: number
  y: number
  width: number
  height: number
  title: string
  content: string
  locked: boolean
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
    defaultContent: string
  }
> = {
  main: {
    bg: "#222222",
    badge: "main",
    defaultTitle: "skill",
    defaultContent: `---
name: your-skill-name
description: This skill should be used when the user asks to "specific phrase 1" or "specific phrase 2".
version: 1.0.0
---

# Skill Goal
A brief statement of what this skill achieves (e.g., "Standardize React Component creation").

## Constraints & Guardrails
*   **Rule 1**: Never use…
*   **Rule 2**: Do not run…
*   **Rule 3**: Use only …

## Instructions & Workflow
1.  **Step 1 Name**: Examine the…
2.  **Step 2 Name**: Draft a…
3.  **Step 3 Name**: Implement…using the [Your Reference Name](references/your-reference-name.md).

## Examples
*   **Example 1 Name**: [Example code or expected behavior goes here]
*   **Example 2 Name**: [Example code or expected behavior goes here]

## References
*   [Your Reference Name](references/your-reference-name.md)
*   [Your Asset Name](assets/your-asset-name.ttf)
*   [Your Asset Name](assets/your-asset-name.png)
*   [Your Script Name](scripts/your-script-name.py)
*   [Your Script Name](scripts/your-script-name.js)
*   [Your Rule Name](rules/your-rule-name.js)
`,
  },
  reference: {
    bg: "#444444",
    badge: "reference",
    defaultTitle: "reference",
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

## Version & Maintenance
- **Last Updated:** YYYY-MM-DD
- **Owner:** [Team/Role]
- **Source:** [Link to original internal doc/repo]
`,
  },
  asset: {
    bg: "#666666",
    badge: "asset",
    defaultTitle: "asset",
    defaultContent: ``,
  },
}
