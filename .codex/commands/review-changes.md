# Review Changes

Use this prompt to review uncommitted CouncilAI changes.

```text
Review the current uncommitted changes.

Focus area:
{{FOCUS_AREA}}

Relevant docs:
{{RELEVANT_DOCS}}

Review priorities:
- Product fit: CouncilAI must remain a minimal decision-focused chat room app with multiple AI instances.
- ChatRoom, AIInstance, Message, and Synthesis boundaries.
- AI orchestration correctness.
- Data integrity.
- UI clarity, accessibility, and low visual noise.
- Missing tests.
- Documentation drift.

Please provide:
1. Findings first, ordered by severity, with file and line references.
2. Open questions or assumptions.
3. Brief change summary.
4. Recommended fixes.

Do not make code changes unless explicitly asked.
```
