---
name: unit-tests-creator
description: "Use this skill when meaningful CouncilAI logic is added and Vitest tests should be created or improved."
---

# Unit Tests Creator

## Instructions

- Use Vitest and React Testing Library.
- Focus on pure logic, validation, data transformations, role templates, AI orchestration helpers, ChatRoom behavior, and synthesis parsing.
- Avoid fragile snapshot tests.
- Avoid testing Tailwind classes.
- Avoid shallow tests that only check static text unless it is a useful smoke test.
- Do not over-test static chat markup.
- Run `npm run test` after adding tests.
