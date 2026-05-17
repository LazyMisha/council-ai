---
name: db-schema-reviewer
description: "Use this skill when reviewing CouncilAI database and Prisma schema changes using ChatRoom, AIInstance, RoleProfile, Message, and Synthesis terminology."
---

# DB Schema Reviewer

## Focus

Review schema changes for the minimal chat room MVP.

## Check

- ChatRoom ownership is explicit.
- AIInstance belongs to ChatRoom.
- AIInstance references a RoleProfile when reusable roles exist.
- Message belongs to ChatRoom.
- AI role messages can reference AIInstance.
- Synthesis belongs to ChatRoom and can link to a Message if represented in the transcript.
- Historical messages and syntheses are preserved.
- Indexes support chat history and message lookup.
- Cascades do not delete audit-critical decision history unexpectedly.
- Supabase auth IDs are referenced consistently once auth exists.

## Reject

- DecisionThread or dashboard terminology in new schema work.
- Raw file bytes in PostgreSQL.
- Secrets in domain tables.
