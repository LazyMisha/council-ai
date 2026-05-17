---
name: universal-code-reviewer
description: "Use this skill to review uncommitted changes for code quality, maintainability, Next.js, React, TypeScript, testing, and clean architecture."
---

# Universal Code Reviewer

Use this skill when reviewing code changes before commit.

## Review priorities

### 1. Correctness
- Does the code do what the feature requires?
- Are edge cases handled?
- Are loading, empty, and error states reasonable?
- Are async flows safe and understandable?

### 2. Simplicity
- Is the solution simpler than the problem requires?
- Is there unnecessary abstraction?
- Can duplicated logic be extracted safely?
- Can confusing code be renamed or split?

### 3. React best practices
- Keep components focused and readable.
- Avoid unnecessary state.
- Avoid derived state when it can be computed.
- Avoid unnecessary effects.
- Keep effects small and dependency-safe.
- Avoid prop drilling when a small composition change is enough.
- Do not introduce global state unless clearly needed.

### 4. Next.js App Router best practices
- Prefer Server Components by default.
- Use "use client" only for interactivity, browser APIs, state, effects, refs, or client hooks.
- Keep server-only logic out of client components.
- Keep API routes/route handlers thin.
- Keep secrets on the server only.
- Avoid unnecessary client-side data fetching when server-side fetching is better.
- Use route handlers for backend/API behavior.
- Do not expose environment secrets to the browser.

### 5. TypeScript
- Prefer clear domain types.
- Avoid `any` unless there is a strong reason.
- Avoid unsafe casts.
- Keep types close to the domain.
- Prefer narrow unions for statuses, roles, and message types.
- Validate external inputs at boundaries.

### 6. DRY and maintainability
- Remove duplicated logic.
- Avoid repeated magic strings.
- Extract constants/helpers only when it improves clarity.
- Do not over-abstract one-off code.
- Keep file and function names clear.
- Remove dead code, unused imports, and debug logs.

### 7. UI component quality
- Components should have clear responsibility.
- Avoid large components that mix rendering, state, and domain logic.
- Keep styling consistent with the project design system.
- Avoid testing Tailwind classes directly.
- Preserve accessibility basics: labels, buttons, keyboard behavior, readable contrast.

### 8. Testing
- Meaningful logic should have tests.
- Prefer tests for helpers, state transitions, validation, orchestration, and user-visible behavior.
- Avoid brittle snapshots.
- Avoid tests that only assert static text unless they are useful smoke tests.
- Run existing quality scripts.

### 9. Security and reliability
- No secrets in code.
- No unsafe logging of tokens, prompts, or private user data.
- Validate API inputs.
- Handle failed network/API calls gracefully.
- Avoid dangerous localStorage parsing without fallback.

## Review process

1. Inspect `git status`.
2. Inspect `git diff`.
3. Review changed files and related tests.
4. Read extra docs only if relevant:
   - `docs/design-system.md` for UI changes.
   - `docs/ai-orchestration.md` for AI behavior changes.
   - `docs/architecture.md` for structural changes.
5. Group findings:
   - Must fix
   - Should fix
   - Nice to have
6. Apply only small safe fixes.
7. Do not implement new product features.
8. Run `npm run quality` if available.
9. Report:
   - files reviewed
   - files changed
   - issues fixed
   - remaining suggestions
   - quality result
