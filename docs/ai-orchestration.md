# AI Orchestration

CouncilAI orchestration happens inside a chat room. The user sends a message, selected AI instances respond according to their roles, the user can manually continue the discussion, and an internal moderator can create a concise summary.

The first minimal AI orchestration route is implemented at `/api/chat-room/respond`. It uses `OPENAI_API_KEY` for OpenAI-backed role responses and falls back to `generateMockAIResponses` in `src/features/chat-room/server/mock-ai.ts` when the key is missing or a provider call fails. Internal summaries are generated through `/api/chat-room/summarize` and fall back to a mock moderator summary.

## MVP Model

The first real implementation should be manual:

1. User starts a topic or replies in a chat room.
2. User sends the message.
3. Client shows that CouncilAI is choosing who should answer next.
4. An internal smart speaker selector chooses exactly one AI instance for the first response.
5. Client shows the selected role-specific thinking indicator.
6. Server generates one response from the selected AI instance.
7. Client appends the returned role response as a message.
8. The app continues AI-to-AI discussion automatically.
9. After at least 10 AI messages since the latest user message, an internal finish detector can stop the auto-discussion.
10. The finish detector either enables Summarize or asks one consolidated set of user questions.

## Speaker Selection

When the user sends a normal message or Auto-discuss advances a turn, a smart speaker selector picks the next AI instance. The selector is invisible: it does not appear in the AI role bar and does not create a visible role message. It never asks the user for clarification; user-question decisions belong to finish detection.

```json
{ "status": "selected", "aiInstanceId": "...", "reason": "..." }
```

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

The finish detector is invisible: it does not appear in the AI role bar and does not create a visible chat message. It runs after each auto-discussion AI response.

Possible statuses:
- `ready_to_summarize`: enough key arguments exist, a tradeoff or disagreement was explored, and there are practical next steps.
- `continue_discussion`: the discussion is still shallow or important roles have not contributed enough.
- `needs_user_input`: AI instances raised user-facing questions, later AI messages did not resolve them, and those unresolved questions block a useful summary. The detector must include a short recap before the questions.

If `OPENAI_API_KEY` is missing or the detector fails, a deterministic fallback is used:
- Prefer `continue_discussion` when fewer than 10 AI messages exist after the latest user message.
- Prefer `continue_discussion` when fewer than 3 distinct AI roles have contributed.
- Prefer `ready_to_summarize` when 10 or more AI messages from 3 or more roles exist.

The finish detector has a hard 10-AI-message gate since the latest user message. Before that gate, it cannot summarize or ask the user questions. When it decides the discussion is ready to summarize, it sets the room's `canSummarize` flag to `true` and stops auto-discussion. Once this flag is set, it stays `true` for that room's lifetime — it is not reset by new user messages or additional Auto-discuss turns. The Summarize button is shown whenever `canSummarize` is `true` and AI messages exist in the room.

When the detector returns `needs_user_input`, the client appends one system clarification message with a short discussion summary followed by up to three consolidated questions, then stops auto-discussion. After the user answers, the 10-AI-message gate resets and applies to fresh AI responses after that answer.

The `canSummarize` flag is persisted in `localStorage` as part of the chat room state. It is reset only when:
- the room's messages are cleared
- the room is deleted

When the finish detector returns `continue_discussion`, no status text is shown and auto-discussion continues.

## Auto-Discussion Mode

An optional Auto-discuss action lets the user run multiple selected-speaker turns automatically.

Behavior:
- Shown after the first AI discussion round exists.
- When clicked, the app enters auto-discussion mode.
- Each turn uses the existing smart speaker selector to pick one AI instance.
- Sending the first topic also enters auto-discussion mode automatically after the first AI response.
- If finish detection requests clarification, Auto-discuss stops and the app appends a system message summarizing those questions.
- While the latest message is a clarification request, Auto-discuss is hidden and Send remains available for the user's answer.
- After each AI response, the finish detector runs. If it says `ready_to_summarize`, the Summarize button is shown and Auto-discuss stops.
- Auto-discussion stops when:
  - the user clicks Stop
  - a max turn limit (20) is reached
  - an API error occurs

The Stop button appears while auto-discussion is running and prevents future turns from starting. In-flight requests may still complete.

Send is disabled while auto-discussion is running. Summarize remains available if it becomes available during auto-discussion. The pending indicator shows either speaker selection or the selected AI instance thinking. When Stop is clicked, the Stop button changes to `Stopping` until the current in-flight turn finishes.

## Future Improvements

- Streaming role responses.
- Model selection by role.
- Uploaded context.
- Evaluation tests for synthesis quality.
