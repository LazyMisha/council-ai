---
name: ai-orchestration-reviewer
description: "Use this skill when reviewing role-based AI instances, chat orchestration, role responses, and final synthesis behavior in CouncilAI."
---

# AI Orchestration Reviewer

## Focus

Review AI orchestration inside a chat.

## Check

- User message is the trigger for `Run council`.
- Selected AI instances respond according to their roles.
- Role prompts use chat context, not dashboard/thread terminology.
- OpenAI calls stay server-side.
- Role responses are structured enough to persist and synthesize.
- Moderator/final synthesis happens after role responses.
- Partial role failures are visible and retryable.
- Model name, prompt version, token usage, and provider metadata can be tracked.

## Reject

- Generic single-assistant behavior.
- Client-side OpenAI calls.
- Overbuilt council workflows before the chat loop works.
