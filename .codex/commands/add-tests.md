# Add Tests

Use this prompt to add or improve tests for a CouncilAI feature.

```text
Add or improve tests for this CouncilAI area.

Feature or module:
{{FEATURE_OR_MODULE}}

Behavior to verify:
{{BEHAVIOR}}

Files likely involved:
{{FILES}}

Risk areas:
{{RISKS}}

Testing constraints:
- Keep tests focused on product behavior.
- Cover Chat, AIInstance, RoleProfile, Message, Synthesis, validation, or orchestration behavior when relevant.
- Avoid brittle tests tied to exact AI prose.
- Avoid testing Tailwind classes or static chat markup unless it is a useful smoke test.

Please:
1. Inspect existing tests and patterns.
2. Add the smallest useful test coverage.
3. Run relevant checks.
4. Summarize what is covered and what remains untested.
```
