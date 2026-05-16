# AI Orchestration

CouncilAI orchestration happens inside a chat room. The user sends a message, selected AI instances respond according to their roles, and a moderator/synthesis step creates a final summary.

The first minimal AI orchestration route is implemented at `/api/chat-room/respond`. It uses `OPENAI_API_KEY` for OpenAI-backed role responses and falls back to `generateMockAIResponses` in `src/lib/chat-room/mock-ai.ts` when the key is missing or a provider call fails.

## MVP Model

The first real implementation should be manual:

1. User starts a topic or replies in a chat room.
2. User sends the message.
3. Client sends recent messages and selected AI instances to the route.
4. Server builds one role-specific prompt per AI instance.
5. AI instances respond in role.
6. Client appends returned role responses as messages.
7. Moderator synthesis is still future work.

## Placement

OpenAI calls must stay in server-only code:

- Server actions for user-triggered message sends or AI response generation.
- Route handlers if an API boundary is cleaner.
- Server-only orchestration modules for prompt building and parsing.

Client Components may trigger actions but must not call OpenAI directly.

## Prompt Inputs

Each AI instance prompt should receive:

- Chat room title or summary.
- User's latest question, idea, or dilemma.
- Relevant recent messages.
- AI instance role name and role instructions.
- Required response schema.

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

## Synthesis Shape

```ts
type Synthesis = {
  summary: string;
  recommendation: string;
  tradeoffs: string[];
  openQuestions: string[];
  nextSteps: string[];
  confidence: "low" | "medium" | "high";
};
```

## Error Handling

- Preserve successful role responses if one role fails.
- Show failed roles clearly.
- Allow retry.
- Store model name, prompt version, token usage, and provider metadata.

## Future Improvements

- Streaming role responses.
- Parallel role calls.
- Model selection by role.
- Uploaded context.
- Evaluation tests for synthesis quality.
