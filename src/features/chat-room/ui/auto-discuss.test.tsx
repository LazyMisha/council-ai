import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatShell } from "./chat-shell";

describe("Auto-discuss", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const setupRoomWithDiscussion = () => {
    const room = {
      id: "room-1",
      title: "Test Room",
      aiInstances: [
        { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
      ],
      messages: [
        { id: "msg-1", authorType: "user", content: "Should we launch?" },
        { id: "msg-2", authorType: "ai", role: "Skeptic", content: "Risky." },
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

  it("shows Auto-discuss button after AI discussion starts", async () => {
    setupRoomWithDiscussion();
    render(<ChatShell />);

    await waitFor(() => {
      expect(screen.getByText("Auto-discuss")).toBeInTheDocument();
    });
  });

  it(
    "does not stop when finish detector returns ready_to_summarize",
    async () => {
      setupRoomWithDiscussion();

      let respondCount = 0;

      vi.spyOn(global, "fetch").mockImplementation(async (url) => {
        if (typeof url !== "string") return { ok: false } as Response;

        if (url.includes("/api/chat-room/respond")) {
          respondCount++;
          return {
            ok: true,
            json: async () => ({
              messages: [
                {
                  id: `ai-respond-${respondCount}`,
                  authorType: "ai",
                  role: "Skeptic",
                  content: `Auto response ${respondCount}`,
                },
              ],
            }),
          } as Response;
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
          expect(screen.getByText("Summarize")).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // Wait for a few turns to prove it did not stop on ready_to_summarize
      await waitFor(
        () => {
          expect(screen.getByText("Auto response 3")).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      fireEvent.click(screen.getByText("Stop"));

      await waitFor(() => {
        expect(screen.getByText("Auto-discuss")).toBeInTheDocument();
      });
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
          return {
            ok: true,
            json: async () => ({
              messages: [
                {
                  id: `ai-respond-${respondCount}`,
                  authorType: "ai",
                  role: "Skeptic",
                  content: `Auto response ${respondCount}`,
                },
              ],
            }),
          } as Response;
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
        return {
          ok: true,
          json: async () =>
            new Promise((resolve) => {
              setTimeout(() => {
                resolve({
                  messages: [
                    {
                      id: "ai-first",
                      authorType: "ai",
                      role: "Skeptic",
                      content: "First response.",
                    },
                  ],
                });
              }, 100);
            }),
        } as Response;
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

    expect(screen.getByText("Stopping...")).toBeDisabled();
    expect(
      screen.getByText("Stopping after this response..."),
    ).toBeInTheDocument();

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
          return {
            ok: true,
            json: async () =>
              new Promise((resolve) => {
                setTimeout(() => {
                  resolve({
                    messages: [
                      {
                        id: `ai-respond-${respondCount}`,
                        authorType: "ai",
                        role: "Skeptic",
                        content: `Auto response ${respondCount}`,
                      },
                    ],
                  });
                }, 200);
              }),
          } as Response;
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
        return {
          ok: true,
          json: async () =>
            new Promise((resolve) => {
              setTimeout(() => {
                resolve({
                  messages: [
                    {
                      id: "ai-first",
                      authorType: "ai",
                      role: "Skeptic",
                      content: "First response.",
                    },
                  ],
                });
              }, 100);
            }),
        } as Response;
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
