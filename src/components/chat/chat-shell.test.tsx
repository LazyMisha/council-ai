import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ChatShell } from "./chat-shell";

describe("ChatShell", () => {
  beforeEach(() => {
    window.localStorage.clear();
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

  it("shows Continue discussion after a summary exists", async () => {
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
      expect(screen.getByText("Continue discussion")).toBeInTheDocument();
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
