# CouncilAI

CouncilAI is a minimal chat room application for better decisions. Each chat room can include multiple AI instances with different roles, such as Software Architect, Business Analyst, Skeptic, and Optimist.

The user creates a chat room, adds AI instances, starts a topic, and can join the conversation anytime while AI instances discuss the topic and contribute role-based responses plus a final synthesis.

## Current Status

The project is a Next.js App Router app with a minimal local-state chat room UI, fixed-order AI instance discussion rounds, and an internal moderator summary action. Auth, persistence, file upload, and realtime collaboration are not implemented yet.

## MVP Scope

- Left sidebar with CouncilAI, `+ New chat room`, and chat rooms.
- Main chat room area with user messages on the right and AI instance messages on the left.
- AI instances area showing roles in the current chat room.
- Message input with `Start a topic or reply...`.
- Local message sending and API-generated AI instance responses.
- Continue discussion action for another fixed-order AI round.
- Internal moderator summary message.
- Mock AI instance fallback when `OPENAI_API_KEY` is missing.

Out of scope for the first MVP: dashboards, long marketing pages, file upload, collaboration, billing, background jobs, and complex routing.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Vitest and React Testing Library
- Planned later: Prisma, PostgreSQL, Supabase Auth, Supabase Storage, OpenAI API

## Local Development

```bash
npm install
npm run dev
npm run quality
```

The app runs at [http://localhost:3000](http://localhost:3000) by default.

Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY` to enable real AI instance responses. Without it, CouncilAI uses local mock responses.

## Next Planned Steps

1. Persist chat rooms, messages, roles, and syntheses.
2. Add auth after the core chat room loop is clear.
3. Replace localStorage with database-backed chat rooms.
