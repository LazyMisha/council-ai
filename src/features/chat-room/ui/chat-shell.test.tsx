import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { ChatShell } from "./chat-shell";

describe("ChatShell", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createRoomFromEmptyState = () => {
    const newRoomButtons = screen.getAllByRole("button", {
      name: "+ New chat room",
    });

    fireEvent.click(newRoomButtons[newRoomButtons.length - 1]);
  };

  it("starts without a seeded mock chat room", () => {
    render(<ChatShell />);

    expect(screen.getByText("No chat rooms")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
  });

  it("creates an empty chat room from the start screen", () => {
    render(<ChatShell />);

    createRoomFromEmptyState();

    expect(
      screen.getByRole("heading", { name: "Untitled chat room" }),
    ).toBeInTheDocument();
  });

  it("shows the message input with the correct placeholder", () => {
    render(<ChatShell />);

    createRoomFromEmptyState();

    expect(
      screen.getByPlaceholderText("Start a topic or reply..."),
    ).toBeInTheDocument();
  });

  it("shows the send button and add-ai button", () => {
    render(<ChatShell />);

    createRoomFromEmptyState();

    expect(screen.getByText("Send")).toBeInTheDocument();
    expect(screen.getByText("+ Add AI")).toBeInTheDocument();
  });

  it("disables Send until the room has an AI instance", () => {
    render(<ChatShell />);

    createRoomFromEmptyState();

    const input = screen.getByLabelText("Start a topic or reply");
    const sendButton = screen.getByRole("button", { name: "Send" });

    expect(sendButton).toBeDisabled();

    fireEvent.change(input, {
      target: { value: "Should we launch?" },
    });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.queryByText("Should we launch?")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "+ Add AI" }));
    fireEvent.click(screen.getByText("Software Architect"));

    expect(sendButton).not.toBeDisabled();
  });

  it("shows speaker selection and role-specific thinking states", async () => {
    const room = {
      id: "room-1",
      title: "Test Room",
      aiInstances: [
        {
          id: "architect",
          name: "Software Architect",
          instructions: "Focus on technical feasibility.",
        },
        { id: "skeptic", name: "Skeptic", instructions: "Focus on risks." },
      ],
      messages: [],
      canSummarize: false,
    };
    const selection = createDeferred<Response>();
    const response = createDeferred<Response>();

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
        return selection.promise;
      }

      if (url.includes("/api/chat-room/respond")) {
        return response.promise;
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
      expect(
        screen.getByPlaceholderText("Start a topic or reply..."),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Start a topic or reply"), {
      target: { value: "Should we launch?" },
    });
    fireEvent.click(screen.getByText("Send"));

    expect(
      screen.getByText("Choosing who should answer next..."),
    ).toBeInTheDocument();

    selection.resolve({
      ok: true,
      json: async () => ({
        aiInstanceId: "architect",
        reason: "Architecture risk first.",
      }),
    } as Response);

    await waitFor(() => {
      expect(
        screen.getByText("Software Architect is thinking..."),
      ).toBeInTheDocument();
    });

    response.resolve({
      ok: true,
      json: async () => ({
        messages: [
          {
            id: "ai-response",
            authorType: "ai",
            role: "Software Architect",
            content: "Start with the integration boundary.",
          },
        ],
      }),
    } as Response);

    await waitFor(() => {
      expect(
        screen.getByText("Start with the integration boundary."),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByText("AI instances are thinking..."),
    ).not.toBeInTheDocument();
  });

  it("shows predefined AI roles after creating a room", () => {
    render(<ChatShell />);

    createRoomFromEmptyState();
    fireEvent.click(screen.getByRole("button", { name: "+ Add AI" }));

    expect(screen.getByText("Software Architect")).toBeInTheDocument();
    expect(screen.getByText("Business Analyst")).toBeInTheDocument();
    expect(screen.getByText("Skeptic")).toBeInTheDocument();
  });

  it("does not show Summarize when no AI discussion exists", () => {
    render(<ChatShell />);

    createRoomFromEmptyState();

    expect(screen.queryByText("Summarize")).not.toBeInTheDocument();
  });

  it("shows Summarize when the room has canSummarize and AI messages", async () => {
    const roomWithDiscussion = {
      id: "room-1",
      title: "Test Room",
      aiInstances: [
        { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
      ],
      messages: [
        { id: "msg-1", authorType: "user", content: "Hello" },
        { id: "msg-2", authorType: "ai", role: "Skeptic", content: "Risky." },
      ],
      canSummarize: true,
    };

    window.localStorage.setItem(
      "council-ai-chat-rooms",
      JSON.stringify({
        chatRooms: [roomWithDiscussion],
        activeRoomId: "room-1",
      }),
    );

    render(<ChatShell />);

    await waitFor(() => {
      expect(screen.getByText("Summarize")).toBeInTheDocument();
    });
  });

  it("hides Summarize after messages are cleared", async () => {
    const roomWithDiscussion = {
      id: "room-1",
      title: "Test Room",
      aiInstances: [
        { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
      ],
      messages: [
        { id: "msg-1", authorType: "user", content: "Hello" },
        { id: "msg-2", authorType: "ai", role: "Skeptic", content: "Risky." },
      ],
      canSummarize: true,
    };

    window.localStorage.setItem(
      "council-ai-chat-rooms",
      JSON.stringify({
        chatRooms: [roomWithDiscussion],
        activeRoomId: "room-1",
      }),
    );

    render(<ChatShell />);

    await waitFor(() => {
      expect(screen.getByText("Summarize")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Chat room options"));
    fireEvent.click(screen.getByText("Clear messages"));
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    await waitFor(() => {
      expect(screen.queryByText("Summarize")).not.toBeInTheDocument();
    });
  });

  it("does not show Continue discussion after a summary exists", async () => {
    const roomWithSummary = {
      id: "room-1",
      title: "Test Room",
      aiInstances: [
        { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
        {
          id: "ai-2",
          name: "Optimist",
          instructions: "Focus on opportunities.",
        },
      ],
      messages: [
        { id: "msg-1", authorType: "user", content: "Hello" },
        { id: "msg-2", authorType: "ai", role: "Skeptic", content: "Risky." },
        {
          id: "msg-summary",
          authorType: "summary",
          role: "Summary",
          content: "Short answer: be careful.",
        },
      ],
      canSummarize: false,
    };

    window.localStorage.setItem(
      "council-ai-chat-rooms",
      JSON.stringify({
        chatRooms: [roomWithSummary],
        activeRoomId: "room-1",
      }),
    );

    render(<ChatShell />);

    await waitFor(() => {
      expect(screen.queryByText("Continue discussion")).not.toBeInTheDocument();
      expect(screen.getByText("Auto-discuss")).toBeInTheDocument();
    });
  });

  it("shows Send after a summary exists", async () => {
    const roomWithSummary = {
      id: "room-1",
      title: "Test Room",
      aiInstances: [
        { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
      ],
      messages: [
        { id: "msg-1", authorType: "user", content: "Hello" },
        { id: "msg-2", authorType: "ai", role: "Skeptic", content: "Risky." },
        {
          id: "msg-summary",
          authorType: "summary",
          role: "Summary",
          content: "Short answer: be careful.",
        },
      ],
      canSummarize: false,
    };

    window.localStorage.setItem(
      "council-ai-chat-rooms",
      JSON.stringify({
        chatRooms: [roomWithSummary],
        activeRoomId: "room-1",
      }),
    );

    render(<ChatShell />);

    await waitFor(() => {
      expect(screen.getByText("Send")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Start a topic or reply...")).toBeInTheDocument();
    });
  });

  it("shows Summarize when a summary message exists even if canSummarize is false", async () => {
    const roomWithSummary = {
      id: "room-1",
      title: "Test Room",
      aiInstances: [
        { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
      ],
      messages: [
        { id: "msg-1", authorType: "user", content: "Hello" },
        { id: "msg-2", authorType: "ai", role: "Skeptic", content: "Risky." },
        {
          id: "msg-summary",
          authorType: "summary",
          role: "Summary",
          content: "Short answer: be careful.",
        },
      ],
      canSummarize: false,
    };

    window.localStorage.setItem(
      "council-ai-chat-rooms",
      JSON.stringify({
        chatRooms: [roomWithSummary],
        activeRoomId: "room-1",
      }),
    );

    render(<ChatShell />);

    await waitFor(() => {
      expect(screen.getByText("Summarize")).toBeInTheDocument();
    });
  });
});

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}
