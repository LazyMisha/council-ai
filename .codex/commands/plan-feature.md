# Plan Feature

Use this prompt to plan a CouncilAI feature before coding.

```text
Plan this CouncilAI feature before writing code.

Feature:
{{FEATURE_NAME}}

Goal:
{{FEATURE_GOAL}}

Scope:
{{IN_SCOPE}}

Out of scope:
{{OUT_OF_SCOPE}}

Relevant docs:
{{RELEVANT_DOCS}}

Constraints:
- CouncilAI is a minimal decision-focused chat app with multiple AI role instances per chat.
- Preserve the core flow: chat, AI instances, user message, role responses, final synthesis.
- Avoid dashboard-first UI, long marketing pages, and overbuilt workflows.
- Keep the plan small enough for one developer to implement.

Please produce:
1. Product behavior summary.
2. Data model impact.
3. UI impact.
4. AI orchestration impact.
5. Implementation steps.
6. Test plan.
7. Documentation updates.
8. Risks and open questions.
```
