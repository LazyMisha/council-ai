---
name: db-schema-reviewer
description: "Use this skill when reviewing CouncilAI database and Prisma schema changes using Chat, AIInstance, RoleProfile, Message, and Synthesis terminology."
---

# DB Schema Reviewer

## Focus

Review schema changes for the minimal chat MVP.

## Check

- Chat ownership is explicit.
- AIInstance belongs to Chat.
- AIInstance references a RoleProfile when reusable roles exist.
- Message belongs to Chat.
- AI role messages can reference AIInstance.
- Synthesis belongs to Chat and can link to a Message if represented in the transcript.
- Historical messages and syntheses are preserved.
- Indexes support chat history and message lookup.
- Cascades do not delete audit-critical decision history unexpectedly.
- Supabase auth IDs are referenced consistently once auth exists.

## Reject

- DecisionThread or dashboard terminology in new schema work.
- Raw file bytes in PostgreSQL.
- Secrets in domain tables.
