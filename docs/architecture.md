# Architecture

CouncilAI is a Next.js App Router application for a minimal multi-AI-instance chat room experience.

The core domain object is `ChatRoom`. A chat room contains messages, AI instances with roles, and eventually a final synthesis.

## Current Repository Shape

- `src/app/page.tsx`: renders the main chat room UI directly.
- `src/app/chat/page.tsx`: alternate route for the same chat room UI.
- `src/components/chat/`: minimal chat shell components.
- `src/app/api/chat-room/respond/route.ts`: API route for fixed-order AI instance response rounds and continue discussion rounds.
- `src/app/api/chat-room/summarize/route.ts`: API route for internal moderator summaries.
- `src/lib/chat-room/`: chat room types, seed data, room-title helper, prompts, mock AI fallback, AI orchestration, and localStorage persistence.
- `src/app/globals.css`: Tailwind theme tokens.

## Current Runtime

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Vitest and React Testing Library

No database, auth provider, or storage provider is wired yet. Chat rooms, AI instances, messages, and the active room are persisted in the browser via `localStorage` through `src/lib/chat-room/storage.ts`. This layer is intentionally small and easy to remove when database persistence is added.

The current UI uses local React state for chat rooms, AI instances, and messages. AI instance replies are requested through `/api/chat-room/respond`; the route uses OpenAI when `OPENAI_API_KEY` exists and falls back to mock responses otherwise. Moderator summaries are requested through `/api/chat-room/summarize` and are stored as summary messages in the same local chat history.

## Target System

```text
User
  -> Next.js chat room UI
  -> Server action or route handler
  -> OpenAI orchestration
  -> Prisma
  -> PostgreSQL
```

Later integrations:

- Supabase Auth for users.
- Supabase Storage for uploaded context.
- OpenAI API for AI instance responses and final synthesis.

## Main Areas

### Web App

- Sidebar with chat rooms.
- Main message area.
- AI instances area for the current chat room.
- Message input.
- API-generated AI instance responses with mock fallback.
- Continue discussion action.
- Internal moderator summary display.

Keep this UI sparse and chat-like. Avoid dashboard patterns unless explicitly requested later.

### Server Layer

- Validates user access once auth exists.
- Reads and writes chat rooms, AI instances, messages, and syntheses.
- Builds role prompts.
- Calls OpenAI from server-only code.
- Parses structured AI outputs before persistence.

### Database

PostgreSQL with Prisma is planned. Initial persistence should model ChatRoom, AIInstance, RoleProfile, Message, and Synthesis.

## Boundaries

- OpenAI calls stay server-side.
- Client Components should not own orchestration or persistence rules.
- AI outputs should be structured before persistence.
- Do not introduce background jobs until synchronous AI instance responses are clearly insufficient.
- Do not add dashboard, project, artifact, or marketing concepts to the MVP shell.
