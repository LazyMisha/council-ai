# Update Docs

Use this prompt to update CouncilAI documentation after implementation.

```text
Update CouncilAI documentation for this completed change.

Change summary:
{{CHANGE_SUMMARY}}

Files changed:
{{FILES_CHANGED}}

Docs to consider:
{{DOCS_TO_CONSIDER}}

Documentation constraints:
- Keep docs concise and practical.
- Keep terminology consistent: ChatRoom, AIInstance, RoleProfile, Message, Synthesis.
- Use "chat room" for the user-created object.
- Do not document speculative features as current behavior.
- Mark future work clearly.

Please update relevant docs for:
1. Product behavior.
2. Architecture or data flow.
3. AI orchestration behavior.
4. Data model changes.
5. Developer workflow changes.

Then summarize the documentation updates and any remaining drift.
```
