# Implement Feature

Use this prompt to implement a scoped CouncilAI feature.

```text
Implement this scoped CouncilAI feature.

Feature:
{{FEATURE_NAME}}

Approved plan:
{{APPROVED_PLAN}}

Files likely involved:
{{FILES}}

Acceptance criteria:
{{ACCEPTANCE_CRITERIA}}

Constraints:
- Keep the MVP minimal and chat-like.
- Do not add unrelated features.
- Do not add dependencies unless explicitly approved.
- Keep OpenAI calls server-side.
- Preserve ChatRoom, AIInstance, Message, and Synthesis concepts.
- Avoid dashboards, long marketing pages, roadmap UI, and excessive components.
- Update docs when behavior changes.

Please:
1. Inspect the existing code and docs first.
2. Make the smallest coherent implementation.
3. Add or update focused tests where appropriate.
4. Run relevant checks.
5. Summarize changed files, verification, and follow-up risks.
```
