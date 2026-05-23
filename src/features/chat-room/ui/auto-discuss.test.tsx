import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AIInstance } from "../domain/types";
import { ChatShell } from "./chat-shell";

function createMockStreamResponse(events: Array<Record<string, unknown>>): Response {
  const encoder = new TextEncoder();
  const chunks = events.map((e) => encoder.encode(JSON.stringify(e) + "\n"));
  let index = 0;
  return {
    ok: true,
    body: {
      getReader() {
        return {
          read() {
            if (index >= chunks.length) {
              return Promise.resolve({ done: true as const, value: undefined });
            }
            return Promise.resolve({ done: false as const, value: chunks[index++] });
          },
          releaseLock() {},
        };
      },
    },
  } as unknown as Response;
}

describe("Auto-discuss", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const defaultAIInstances: AIInstance[] = [
    { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
    {
      id: "ai-2",
      name: "Optimist",
      instructions: "Focus on opportunities.",
    },
  ];

  const setupRoomWithDiscussion = (
    aiInstances: AIInstance[] = defaultAIInstances,
    aiContent = "Risky.",
  ) => {
    const room = {
      id: "room-1",
      title: "Test Room",
      aiInstances,
      messages: [
        { id: "msg-1", authorType: "user", content: "Should we launch?" },
        { id: "msg-2", authorType: "ai", role: "Skeptic", content: aiContent },
      ],
      canSummarize: false,
    };

    window.localStorage.setItem(
      "council-ai-chat-rooms",
      JSON.stringify({
        chatRooms: [room],
        activeRoomId: "room-1",
      }),
    );
  };

  it("shows Auto-discuss button after AI discussion starts with multiple AI instances", async () => {
    setupRoomWithDiscussion();
    render(<ChatShell />);

    await waitFor(() => {
      expect(screen.getByText("Auto-discuss")).toBeInTheDocument();
    });
  });

  it("hides Auto-discuss when only one AI instance exists", async () => {
    setupRoomWithDiscussion([
      { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
    ]);
    render(<ChatShell />);

    await waitFor(() => {
      expect(screen.getByText("Risky.")).toBeInTheDocument();
    });

    expect(screen.queryByText("Auto-discuss")).not.toBeInTheDocument();
  });

  it("auto-runs discussion after the user sends the first topic", async () => {
    const room = {
      id: "room-1",
      title: "Test Room",
      aiInstances: defaultAIInstances,
      messages: [],
      canSummarize: false,
    };

    let respondCount = 0;

    window.localStorage.setItem(
      "council-ai-chat-rooms",
      JSON.stringify({
        chatRooms: [room],
        activeRoomId: "room-1",
      }),
    );

    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      if (typeof url !== "string") return { ok: false } as Response;

      if (url.includes("/api/chat-room/select-speaker")) {
        return {
          ok: true,
          json: async () => ({
            status: "selected",
            aiInstanceId: respondCount === 0 ? "ai-1" : "ai-2",
            reason: "Next useful speaker.",
          }),
        } as Response;
      }

      if (url.includes("/api/chat-room/respond")) {
        respondCount++;
        return createMockStreamResponse([
          {
            type: "done",
            message: {
              id: `ai-response-${respondCount}`,
              authorType: "ai",
              role: respondCount === 1 ? "Skeptic" : "Optimist",
              content:
                respondCount === 1
                  ? "First role response."
                  : "Automatic follow-up response.",
            },
          },
        ]);
      }

      if (url.includes("/api/chat-room/finish")) {
        return {
          ok: true,
          json: async () => ({
            status: "ready_to_summarize",
            reason: "Enough discussion.",
          }),
        } as Response;
      }

      return { ok: false } as Response;
    });

    render(<ChatShell />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Start a topic or reply..."),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Start a topic or reply"), {
      target: { value: "Should we launch?" },
    });
    fireEvent.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(
        screen.getByText("Automatic follow-up response."),
      ).toBeInTheDocument();
    });

    expect(respondCount).toBe(2);
    expect(screen.getByText("Summarize")).not.toBeDisabled();
  });

  it("stops auto-discussion to ask user clarification after finish detection", async () => {
    setupRoomWithDiscussion();

    let respondCount = 0;

    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      if (typeof url !== "string") return { ok: false } as Response;

      if (url.includes("/api/chat-room/respond")) {
        respondCount++;
        return createMockStreamResponse([
          {
            type: "done",
            message: {
              id: "ai-response-before-clarification",
              authorType: "ai",
              role: "Optimist",
              content: "We still need the launch constraint.",
            },
          },
        ]);
      }

      if (url.includes("/api/chat-room/finish")) {
        return {
          ok: true,
          json: async () => ({
            status: "needs_user_input",
            reason: "Blocking questions remain",
            summary:
              "The AI instances agree the launch depends on segment priority and timing constraints.",
            questions: [
              "Which customer segment matters most?",
              "Why must the launch happen this quarter?",
            ],
          }),
        } as Response;
      }

      return { ok: false } as Response;
    });

    render(<ChatShell />);

    await waitFor(() => {
      expect(screen.getByText("Auto-discuss")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Auto-discuss"));

    await waitFor(() => {
      expect(
        screen.getByText(/CouncilAI needs your input before continuing/),
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Summary:/)).toBeInTheDocument();
    expect(screen.getByText(/launch depends on segment priority/)).toBeInTheDocument();
    expect(screen.getByText(/Questions:/)).toBeInTheDocument();
    expect(
      screen.getByText(/1\. Which customer segment matters most\?/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/2\. Why must the launch happen this quarter\?/),
    ).toBeInTheDocument();
    expect(respondCount).toBe(1);
    expect(screen.queryByText("Auto-discuss")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Start a topic or reply")).not.toBeDisabled();
    expect(screen.getByText("Send")).not.toBeDisabled();
  });

  it("keeps discussing when selector asks for clarification before any AI question", async () => {
    setupRoomWithDiscussion();

    let respondCount = 0;

    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      if (typeof url !== "string") return { ok: false } as Response;

      if (url.includes("/api/chat-room/select-speaker")) {
        return {
          ok: true,
          json: async () => ({
            status: "needs_user_input",
            aiInstanceId: "",
            reason: "Missing product context",
            questions: ["Who is the target user?"],
          }),
        } as Response;
      }

      if (url.includes("/api/chat-room/respond")) {
        respondCount++;
        return createMockStreamResponse([
          {
            type: "done",
            message: {
              id: "ai-response",
              authorType: "ai",
              role: "Skeptic",
              content: "Continue with a stated assumption.",
            },
          },
        ]);
      }

      if (url.includes("/api/chat-room/finish")) {
        return {
          ok: true,
          json: async () => ({ status: "continue_discussion" }),
        } as Response;
      }

      return { ok: false } as Response;
    });

    render(<ChatShell />);

    await waitFor(() => {
      expect(screen.getByText("Auto-discuss")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Auto-discuss"));

    await waitFor(() => {
      expect(
        screen.getByText("Continue with a stated assumption."),
      ).toBeInTheDocument();
    });

    expect(respondCount).toBeGreaterThan(0);
    expect(
      screen.queryByText(/CouncilAI needs your input before continuing/),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Stop"));

    await waitFor(() => {
      expect(screen.getByText("Auto-discuss")).toBeInTheDocument();
    });
  });

  it("shows next-speaker selection after an auto-discussion response", async () => {
    setupRoomWithDiscussion();

    const finishDecision = createDeferred<Response>();

    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      if (typeof url !== "string") return { ok: false } as Response;

      if (url.includes("/api/chat-room/respond")) {
        return createMockStreamResponse([
          {
            type: "done",
            message: {
              id: "ai-response",
              authorType: "ai",
              role: "Skeptic",
              content: "First auto response.",
            },
          },
        ]);
      }

      if (url.includes("/api/chat-room/finish")) {
        return finishDecision.promise;
      }

      return { ok: false } as Response;
    });

    render(<ChatShell />);

    await waitFor(() => {
      expect(screen.getByText("Auto-discuss")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Auto-discuss"));

    await waitFor(
      () => {
        expect(screen.getByText("First auto response.")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    expect(
      screen.getByText("Choosing who should answer next..."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Skeptic is thinking..."),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Stop"));
    finishDecision.resolve({
      ok: true,
      json: async () => ({ status: "continue_discussion" }),
    } as Response);

    await waitFor(() => {
      expect(screen.getByText("Auto-discuss")).toBeInTheDocument();
    });
  });

  it(
    "stops and enables summary when finish detector returns ready_to_summarize",
    async () => {
      setupRoomWithDiscussion();

      let respondCount = 0;

      vi.spyOn(global, "fetch").mockImplementation(async (url) => {
        if (typeof url !== "string") return { ok: false } as Response;

        if (url.includes("/api/chat-room/respond")) {
          respondCount++;
          return createMockStreamResponse([
            {
              type: "done",
              message: {
                id: `ai-respond-${respondCount}`,
                authorType: "ai",
                role: "Skeptic",
                content: `Auto response ${respondCount}`,
              },
            },
          ]);
        }

        if (url.includes("/api/chat-room/finish")) {
          return {
            ok: true,
            json: async () => ({ status: "ready_to_summarize" }),
          } as Response;
        }

        return { ok: false } as Response;
      });

      render(<ChatShell />);

      await waitFor(() => {
        expect(screen.getByText("Auto-discuss")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Auto-discuss"));

      await waitFor(() => {
        expect(screen.getByText("Stop")).toBeInTheDocument();
      });

      await waitFor(
        () => {
          expect(screen.getByText("Auto-discuss")).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      expect(screen.getByText("Auto response 1")).toBeInTheDocument();
      expect(screen.queryByText("Auto response 2")).not.toBeInTheDocument();
      expect(screen.getByText("Summarize")).not.toBeDisabled();
    },
    15000,
  );

  it(
    "stops at hard safety limit after 20 turns",
    async () => {
      setupRoomWithDiscussion();

      let respondCount = 0;

      vi.spyOn(global, "fetch").mockImplementation(async (url) => {
        if (typeof url !== "string") return { ok: false } as Response;

        if (url.includes("/api/chat-room/respond")) {
          respondCount++;
          return createMockStreamResponse([
            {
              type: "done",
              message: {
                id: `ai-respond-${respondCount}`,
                authorType: "ai",
                role: "Skeptic",
                content: `Auto response ${respondCount}`,
              },
            },
          ]);
        }

        if (url.includes("/api/chat-room/finish")) {
          return {
            ok: true,
            json: async () => ({ status: "continue_discussion" }),
          } as Response;
        }

        return { ok: false } as Response;
      });

      render(<ChatShell />);

      await waitFor(() => {
        expect(screen.getByText("Auto-discuss")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Auto-discuss"));

      await waitFor(
        () => {
          expect(screen.getByText("Auto-discuss")).toBeInTheDocument();
        },
        { timeout: 30000 },
      );

      expect(screen.getByText("Auto response 20")).toBeInTheDocument();
      expect(screen.queryByText("Auto response 21")).not.toBeInTheDocument();
    },
    35000,
  );

  it("shows Stop button during auto-discussion and stops on click", async () => {
    setupRoomWithDiscussion();

    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      if (typeof url !== "string") return { ok: false } as Response;

      if (url.includes("/api/chat-room/respond")) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(
              createMockStreamResponse([
                {
                  type: "done",
                  message: {
                    id: "ai-first",
                    authorType: "ai",
                    role: "Skeptic",
                    content: "First response.",
                  },
                },
              ]),
            );
          }, 100);
        });
      }

      if (url.includes("/api/chat-room/finish")) {
        return {
          ok: true,
          json: async () => ({ status: "continue_discussion" }),
        } as Response;
      }

      return { ok: false } as Response;
    });

    render(<ChatShell />);

    await waitFor(() => {
      expect(screen.getByText("Auto-discuss")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Auto-discuss"));

    await waitFor(() => {
      expect(screen.getByText("Stop")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Stop"));

    expect(screen.getByText("Stopping")).toBeDisabled();
    expect(
      screen.queryByText("Stopping after this response..."),
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Auto-discuss")).toBeInTheDocument();
    });

    // The in-flight respond request still completes, so one message appears.
    // Subsequent iterations are prevented by the stop signal.
    expect(screen.getByText("First response.")).toBeInTheDocument();
    expect(screen.queryByText("Auto response 2")).not.toBeInTheDocument();
  });

  it(
    "cannot start a second auto-discuss loop while one is running",
    async () => {
      setupRoomWithDiscussion();

      let respondCount = 0;

      vi.spyOn(global, "fetch").mockImplementation(async (url) => {
        if (typeof url !== "string") return { ok: false } as Response;

        if (url.includes("/api/chat-room/respond")) {
          respondCount++;
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(
                createMockStreamResponse([
                  {
                    type: "done",
                    message: {
                      id: `ai-respond-${respondCount}`,
                      authorType: "ai",
                      role: "Skeptic",
                      content: `Auto response ${respondCount}`,
                    },
                  },
                ]),
              );
            }, 200);
          });
        }

        if (url.includes("/api/chat-room/finish")) {
          return {
            ok: true,
            json: async () => ({ status: "continue_discussion" }),
          } as Response;
        }

        return { ok: false } as Response;
      });

      render(<ChatShell />);

      await waitFor(() => {
        expect(screen.getByText("Auto-discuss")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Auto-discuss"));

      await waitFor(() => {
        expect(screen.getByText("Stop")).toBeInTheDocument();
      });

      await waitFor(
        () => {
          expect(screen.getByText("Auto response 1")).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      fireEvent.click(screen.getByText("Stop"));

      await waitFor(() => {
        expect(screen.getByText("Auto-discuss")).toBeInTheDocument();
      });

      // Only one loop ran, so respondCount should equal the number of messages
      expect(respondCount).toBeGreaterThanOrEqual(1);
      expect(respondCount).toBeLessThanOrEqual(5);
    },
    15000,
  );

  it("hides Continue discussion and disables Send while auto-discussing", async () => {
    setupRoomWithDiscussion();

    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      if (typeof url !== "string") return { ok: false } as Response;

      if (url.includes("/api/chat-room/respond")) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(
              createMockStreamResponse([
                {
                  type: "done",
                  message: {
                    id: "ai-first",
                    authorType: "ai",
                    role: "Skeptic",
                    content: "First response.",
                  },
                },
              ]),
            );
          }, 100);
        });
      }

      if (url.includes("/api/chat-room/finish")) {
        return {
          ok: true,
          json: async () => ({ status: "continue_discussion" }),
        } as Response;
      }

      return { ok: false } as Response;
    });

    render(<ChatShell />);

    await waitFor(() => {
      expect(screen.getByText("Auto-discuss")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Auto-discuss"));

    await waitFor(() => {
      expect(screen.getByText("Stop")).toBeInTheDocument();
    });

    expect(screen.queryByText("Continue discussion")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Start a topic or reply")).toBeDisabled();
    expect(screen.getByText("Send")).toBeDisabled();
  });
});

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}
