# AGENTS.md

Guidance for AI coding agents working on CouncilAI.

## Project Intent

CouncilAI is a minimal chat room app for decision-making. A user creates a chat room, adds multiple AI instances with roles, starts a topic, and can join the conversation anytime while AI instances discuss it and contribute role-based responses plus a final synthesis.

Use `chat room` as the user-created object. Use `AI instances` for role participants. Avoid `dashboard` as a primary MVP concept.

## Current Phase

Minimal MVP shell.

The app currently has a Claude/ChatGPT-like layout: left sidebar, central chat room area, AI instance strip, message input, and synthesis placeholder. Product implementation should stay small and avoid noisy UI.

## Current Stack

- TypeScript
- Next.js App Router
- React
- Tailwind CSS
- Vitest and React Testing Library
- ESLint

## Planned Stack

- PostgreSQL with Prisma
- Supabase Auth
- Supabase Storage
- OpenAI API

## Engineering Style

- Keep implementation steps small and reviewable.
- Prefer boring, explicit code over clever abstractions.
- Use Server Components by default.
- Use `"use client"` only for browser APIs, client state, or client-only hooks.
- Keep OpenAI calls outside React components; use server-only modules, server actions, or route handlers.
- Treat AI outputs as structured domain data.
- Keep UI minimal: no large dashboards, long marketing pages, roadmap sections, or excessive cards.
- When implementing library-specific code, check fresh docs through Context7 MCP if available.
- Add tests around orchestration, validation, data transformations, and role/template logic.

## Automatic Project Skill Use

Use installed skills automatically when relevant. Use the smallest useful set.
Project instructions beat generic skill advice.

Prefer:
- `next-best-practices` for Next.js App Router work.
- `vercel-react-best-practices` for React rendering, async work, performance, and client/server boundaries.
- `nextjs-react-typescript` for general Next.js, React, and TypeScript work.
- `frontend-design`, `web-design-guidelines`, and `ui-ux-pro-max` for UI, layout, interaction, and design review tasks.
- `brand-guidelines` for Anthropic-inspired palette, typography, and visual direction tasks.
- `improve-codebase-architecture` for architecture, refactors, interfaces, and module boundaries.

## Product Constraints

- Chat rooms are the primary product object.
- Each chat room can contain multiple AI instances with explicit roles.
- Main action is `+ New chat room` or `Create new chat room`.
- The MVP should feel like a calm chat app, not a marketing site or enterprise dashboard.
- The input placeholder is `Start a topic or reply...`.
- The main message action is `Send`.
- Auth, database, file upload, realtime, and collaboration are later work.

## Do Not Do Without Explicit Scope

- Do not add dependencies unrelated to the current task.
- Do not create database migrations until Prisma work is requested.
- Do not commit secrets, API keys, or local environment values.
- Do not introduce background jobs before they are needed.
- Do not call OpenAI from Client Components or UI event handlers.

## Post-implementation Checklist

After every meaningful implementation:

1. Simplify the changed code before finishing.
2. Remove unused code, duplicated logic, and unnecessary abstractions.
3. Run `npm run quality` when available.
4. Mention which checks passed and which were skipped.
5. If logic was added, consider adding unit tests.
6. Do not add new dependencies without explaining why.

## Documentation Rules

- Keep docs concise and practical.
- Update architecture, orchestration, and data model docs when product behavior changes.
- Use current terminology: ChatRoom, AIInstance, RoleProfile, Message, Synthesis.
- Mark future work clearly.

## Suggested Build Order

1. Interactive chat room creation.
2. AI instance add/remove UI.
3. Message draft and send behavior.
4. Server-side AI instance response action.
5. Role response persistence.
6. Final synthesis persistence.
7. Auth.
8. File/image context.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- ALWAYS read graphify-out/GRAPH_REPORT.md before reading any source files, running grep/glob searches, or answering codebase questions. The graph is your primary map of the codebase.
- IF graphify-out/wiki/index.md EXISTS, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

@RTK.md
