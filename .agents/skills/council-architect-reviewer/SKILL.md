---
name: council-architect-reviewer
description: "Use this skill when reviewing CouncilAI architecture for the minimal decision-focused multi-AI-role chat MVP."
---

# Council Architect Reviewer

## Focus

Protect the product direction: CouncilAI is a decision-focused chat room app where each ChatRoom can contain multiple AI instances.

## Check

- ChatRoom remains the primary domain object.
- AIInstance role participants belong to a ChatRoom.
- Messages and syntheses belong to a ChatRoom.
- OpenAI calls stay server-side.
- UI remains minimal and chat-like.
- The implementation does not introduce dashboard, project, or marketing concepts into the MVP.
- Persistence supports role responses and final synthesis history.
- Background jobs and complex orchestration are not introduced prematurely.

## Recommendation

Report findings by severity and recommend approve, revise, or block.
