# Product Scope

CouncilAI is a minimal multi-AI-instance chat room app for better decisions.

Each chat room can include AI instances with roles. The user starts a topic, AI instances discuss it, and the user can join the conversation anytime while the app builds toward role-based responses plus a final synthesis.

## Current Product State

The app is a local-state Next.js chat room shell. It has interactive chat room creation, AI instance selection, local message sending, selected-speaker AI instance responses, auto-discussion, and internal moderator summaries. It uses OpenAI when `OPENAI_API_KEY` is configured and falls back to mock responses otherwise. It has no auth, database, uploads, realtime, or collaboration.

## Core User Problem

Users often need more than a single generic answer. They need a few useful perspectives, visible disagreement, and a concise synthesis without managing a complex workflow.

## Primary User Flow

1. User opens CouncilAI.
2. User creates or selects a chat room.
3. User adds AI instances with roles.
4. User starts a topic or replies.
5. User sends the message.
6. CouncilAI selects the next AI instance and shows role-specific thinking state.
7. The selected AI instance responds in the chat room.
8. User can auto-discuss or ask for a moderator summary.

## MVP Features

- Minimal sidebar with `+ New chat room` and chat rooms.
- Main chat room view with user and AI instance messages.
- Compact AI instances area for the current chat room.
- Message input fixed near the bottom.
- Send action.
- API-generated selected AI instance responses with mock fallback.
- Auto-discuss action.
- Internal moderator summary message with mock fallback.

## Not In MVP

- Dashboard views.
- Long marketing landing pages.
- Roadmap UI.
- File/image upload.
- Realtime collaboration.
- Organization billing.
- Public sharing.
- Complex permissions.
- Native mobile app.

## Initial AI Roles

- Software Architect
- Business Analyst
- Skeptic
- Optimist

## Product Principles

- Chat room first.
- Minimal UI.
- Role-based AI responses.
- Synthesis after role responses.
- Clear uncertainty over false certainty.
- Useful decision support, not generic chatbot noise.
