# AI Orchestration

CouncilAI orchestration happens inside a chat room. The user sends a message, selected AI instances respond according to their roles, the user can manually continue the discussion, and an internal moderator can create a concise summary.

The first minimal AI orchestration route is implemented at `/api/chat-room/respond`. It uses `OPENAI_API_KEY` for OpenAI-backed role responses and falls back to `generateMockAIResponses` in `src/lib/chat-room/mock-ai.ts` when the key is missing or a provider call fails. Internal summaries are generated through `/api/chat-room/summarize` and fall back to a mock moderator summary.

## MVP Model

The first real implementation should be manual:

1. User starts a topic or replies in a chat room.
2. User sends the message.
3. Client sends recent messages and selected AI instances to the route.
4. Server processes AI instances in the chat room's current order.
5. Each AI instance receives the recent conversation plus any AI responses already generated in the current round.
6. AI instances respond once each, in role, until one full fixed-order round is complete.
7. Client appends returned role responses as messages.
8. User can click Continue discussion to advance the discussion without sending a new user message. An internal smart speaker selector chooses exactly one AI instance to speak next. The selected instance receives the full chat history and responds in role.
9. User can click Summarize to append one internal moderator summary message.

## Speaker Selection

When the user sends a normal message, the existing fixed-order round still runs: all AI instances respond once each in their defined order.

When the user clicks Continue discussion, a smart speaker selector picks the next AI instance. The selector is invisible: it does not appear in the AI role bar and does not create a visible message. It returns structured data like `{ "aiInstanceId": "...", "reason": "..." }`.

The selector considers which AI instance can add the most value now, who has not spoken recently, who can address unresolved disagreement, who can challenge weak assumptions, and who can move the discussion toward a useful conclusion. It avoids selecting an AI instance that would likely repeat previous points. It also avoids selecting the same AI instance that spoke last when another AI instance can contribute.

If `OPENAI_API_KEY` is missing or the selector fails, a deterministic fallback is used:
- Prefer the AI instance that has spoken least recently.
- Avoid the same AI instance twice in a row when possible.
- Fall back to the first AI instance if needed.

A safety override applies when only one AI instance exists: the selector call is skipped entirely because the choice is deterministic.

## Placement

OpenAI calls must stay in server-only code:

- Server actions for user-triggered message sends or AI response generation.
- Route handlers if an API boundary is cleaner.
- Server-only orchestration modules for prompt building and parsing.

Client Components may trigger actions but must not call OpenAI directly.

## Prompt Inputs

Each AI instance prompt should receive:

- User's latest question, idea, or dilemma for reply mode.
- Full existing chat context for continue mode.
- AI instance role name and role instructions.
- Discussion mode: reply or continue.

## Role Response Shape

```ts
type RoleResponse = {
  role: string;
  summary: string;
  reasoning: string[];
  risks: string[];
  questions: string[];
  confidence: "low" | "medium" | "high";
};
```

## Summary Shape

Summaries are rendered as a special card in the chat history. The internal moderator produces plain text with six labeled sections:

1. **Short answer** — one-sentence synthesis
2. **Key points** — the most important takeaways
3. **Main disagreements / tradeoffs** — where participants differ
4. **Assumptions** — what the group took for granted
5. **Recommendation** — a clear, actionable direction
6. **Next steps** — specific actions to take

The UI renders each section label in bold for easy scanning.

## Error Handling

- Preserve successful role responses if one role fails.
- Show failed roles clearly.
- Allow retry.
- Store model name, prompt version, token usage, and provider metadata.

## Finish Detection

An internal finish detector evaluates whether the discussion has enough useful information after each AI discussion round completes.

The finish detector is invisible: it does not appear in the AI role bar and does not create a visible chat message. It returns structured data like `{ "status": "ready_to_summarize", "reason": "..." }`.

Possible statuses:
- `ready_to_summarize`: enough key arguments exist, a tradeoff or disagreement was explored, and there are practical next steps.
- `continue_discussion`: the discussion is still shallow or important roles have not contributed enough.

If `OPENAI_API_KEY` is missing or the detector fails, a deterministic fallback is used:
- Prefer `continue_discussion` when fewer than 3 AI messages exist.
- Prefer `ready_to_summarize` when 3 or more AI messages exist.

The finish detector runs after each AI discussion round. When it decides the discussion is ready to summarize, it sets the room's `canSummarize` flag to `true`. Once this flag is set, it stays `true` for that room's lifetime — it is not reset by new user messages or additional Continue discussion rounds. The Summarize button is shown whenever `canSummarize` is `true` and AI messages exist in the room.

The `canSummarize` flag is persisted in `localStorage` as part of the chat room state. It is reset only when:
- the room's messages are cleared
- the room is deleted

When the finish detector returns anything other than `ready_to_summarize`, no status text is shown. Continue discussion remains available at all times after an AI discussion round exists.

## Future Improvements

- Streaming role responses.
- Auto-discussion mode.
- Model selection by role.
- Uploaded context.
- Evaluation tests for synthesis quality.
