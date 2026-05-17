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
4. Inspect diff hunks carefully and use changed-file locations from the diff when possible.
5. When reporting an issue, include:
   - severity: Must fix, Should fix, or Nice to have
   - file path
   - line number or line range when possible
   - issue
   - suggested fix
6. If exact line numbers are not available, still include the file path and explain that the location is approximate.
7. Use this concise format:

```text
Must fix:
- src/lib/chat-room/speaker-selector.ts:42
  Issue: Fallback selector can choose the same AI instance twice in a row.
  Suggested fix: Exclude the latest AI speaker when other AI instances are available.

Should fix:
- src/components/chat/message-list.tsx:88-96
  Issue: Message rendering duplicates role-label logic.
  Suggested fix: Extract a small helper or reuse the existing role label component.

Nice to have:
- src/lib/chat-room/types.ts:14
  Issue: Type name is a little too generic.
  Suggested fix: Consider renaming it to ChatRoomMessage later.
```

8. Read extra docs only when relevant:
   - `docs/design-system.md` for UI changes
   - `docs/ai-orchestration.md` for AI changes
   - `docs/architecture.md` for structural changes
9. Apply only small safe fixes.
10. Do not implement new features.
11. Do not add dependencies unless absolutely necessary.
12. Run `npm run quality` after safe fixes.
13. Report:
   - files reviewed
   - issues found with file:line references
   - fixes applied
   - remaining suggestions
   - quality result
