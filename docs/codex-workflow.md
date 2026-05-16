# Codex Workflow

CouncilAI should be built as a minimal multi-AI-instance chat room app. Protect the core loop: chat room, AI instances, user message, role responses, final synthesis.

## Current Repository State

The app is a Next.js App Router project with a local-state chat room UI and a minimal API route for AI instance responses, with mock fallback when `OPENAI_API_KEY` is missing. It has TypeScript, Tailwind CSS, ESLint, Vitest, and React Testing Library.

Do not assume Prisma, Supabase, or OpenAI integration exists until those files and dependencies are added in a scoped task.

## Working Mode

- Work in small increments.
- Prefer fewer files and fewer components.
- Keep UI sparse and chat-like.
- Avoid dashboards, long landing pages, roadmap UI, and excessive cards.
- Update docs when product behavior or terminology changes.

## Context7 MCP Workflow

Use Context7 MCP for fresh library documentation when implementing Next.js App Router, React, Tailwind, Prisma, Supabase, OpenAI SDK, or testing-library-specific code.

## Build Order

1. Persist chat rooms, AI instances, messages, and syntheses.
2. Add final synthesis orchestration.
3. Add auth.
4. Add uploaded context.

## Coding Guidelines

- Use TypeScript.
- Use Server Components by default.
- Use `"use client"` only when needed for interactivity.
- Keep OpenAI calls outside React components.
- Validate inputs at server boundaries.
- Model ChatRoom, AIInstance, RoleProfile, Message, and Synthesis as domain data.
- Avoid premature queues, dashboards, and workflow engines.

## Verification

Run `npm run quality` after meaningful implementation. If unavailable, run existing scripts individually.

## Post-implementation Workflow

1. Run `code-simplifier`.
2. Run `unit-tests-creator` when logic was added.
3. Run `quality-gate`.
4. Summarize files changed and remaining risks.

## Documentation Updates

Update docs when changing:

- MVP scope.
- Chat room behavior.
- AI orchestration.
- Data model.
- Auth or storage assumptions.
- Operational requirements.
