# Code Review

Use the `universal-code-reviewer` skill to review the current uncommitted changes.

Focus on:
- correctness
- simplicity
- React best practices
- Next.js App Router best practices
- TypeScript quality
- DRY and maintainability
- meaningful tests
- security and reliability

Process:
1. Run `git status`.
2. Inspect `git diff`.
3. Review changed files and related tests.
4. Read extra docs only when relevant:
   - `docs/design-system.md` for UI changes
   - `docs/ai-orchestration.md` for AI changes
   - `docs/architecture.md` for structural changes
5. Apply only small safe fixes.
6. Do not implement new features.
7. Do not add dependencies unless absolutely necessary.
8. Run `npm run quality`.
9. Report files reviewed, files changed, fixes made, remaining suggestions, and quality result.
