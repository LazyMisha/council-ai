---
name: council-architect-reviewer
description: "Use this skill when reviewing CouncilAI architecture for the minimal decision-focused multi-AI-role chat MVP."
---

# Council Architect Reviewer

## Focus

Protect the product direction: CouncilAI is a decision-focused chat app where each chat can contain multiple AI role instances.

## Check

- Chat remains the primary domain object.
- AIInstance or AI role participants belong to a chat.
- Messages and syntheses belong to a chat.
- OpenAI calls stay server-side.
- UI remains minimal and chat-like.
- The implementation does not introduce dashboard, project, or marketing concepts into the MVP.
- Persistence supports role responses and final synthesis history.
- Background jobs and complex orchestration are not introduced prematurely.

## Recommendation

Report findings by severity and recommend approve, revise, or block.
