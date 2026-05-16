---
name: quality-gate
description: "Use this skill after implementation changes to run and interpret CouncilAI quality checks."
---

# Quality Gate

## Instructions

- Inspect `package.json` before running commands.
- Prefer `npm run quality` when it exists.
- Otherwise run existing `lint`, `typecheck`, and `test` scripts individually.
- Do not invent missing scripts.
- Do not add dependencies.
- If checks fail, identify the smallest safe fix.
- Report commands run, pass/fail status, skipped checks, and remaining risks.
