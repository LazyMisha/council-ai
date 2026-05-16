# Data Model

This document describes the intended domain model before Prisma schema creation.

The current app uses mock data only. No Prisma schema, database connection, migrations, or persistence layer exists yet.

## Core Entities

### User

Authenticated person using CouncilAI.

Likely backed by Supabase Auth later.

Fields:

- `id`
- `email`
- `createdAt`
- `updatedAt`

### ChatRoom

Primary user-created object.

Fields:

- `id`
- `ownerId`
- `title`
- `status`
- `createdAt`
- `updatedAt`

Possible statuses:

- `draft`
- `active`
- `synthesized`
- `archived`

### RoleProfile

Reusable role definition for an AI instance.

Fields:

- `id`
- `name`
- `description`
- `instructions`
- `createdAt`
- `updatedAt`

Examples:

- Software Architect
- Business Analyst
- Skeptic
- Optimist

### AIInstance

An AI participant attached to a chat room.

Fields:

- `id`
- `chatRoomId`
- `roleProfileId`
- `displayName`
- `instructionsOverride`
- `createdAt`
- `updatedAt`

### Message

A user message, AI instance response, system event, or synthesis-related record in a chat room.

Fields:

- `id`
- `chatRoomId`
- `authorType`
- `aiInstanceId`
- `content`
- `metadata`
- `createdAt`

Possible author types:

- `user`
- `ai`
- `system`

### Synthesis

Final structured synthesis for a chat room.

Fields:

- `id`
- `chatRoomId`
- `messageId`
- `model`
- `promptVersion`
- `output`
- `createdAt`

## Relationships

- User has many ChatRooms.
- ChatRoom has many AIInstances.
- ChatRoom has many Messages.
- ChatRoom has many Syntheses.
- RoleProfile has many AIInstances.
- AIInstance has many Messages.

## Persistence Principles

- Store structured AI outputs as JSON initially.
- Preserve messages and syntheses as historical records.
- Keep provider metadata for debugging and cost tracking.
- Do not store secrets in domain tables.
- Add uploaded context metadata only when file/image support begins.
