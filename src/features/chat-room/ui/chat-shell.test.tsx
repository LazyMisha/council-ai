import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, vi } from "vitest";
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

  it("shows a compact AI instance count and expands the mobile AI list", async () => {
    seedChatRooms([
      {
        id: "room-1",
        title: "Launch Plan",
        aiInstances: [
          {
            id: "architect",
            name: "Software Architect",
            instructions: "Focus on technical feasibility.",
          },
          {
            id: "skeptic",
            name: "Skeptic",
            instructions: "Focus on risks.",
          },
        ],
      },
    ]);

    render(<ChatShell />);

    await waitFor(() => {
      expect(screen.getByText("2 AI instances")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Show added AI instances" }),
    );
    const mobileAIList = screen.getByRole("region", {
      name: "Added AI instances",
    });

    expect(
      within(mobileAIList).getByRole("button", { name: "Software Architect" }),
    ).toBeInTheDocument();
    expect(
      within(mobileAIList).getByRole("button", { name: "Skeptic" }),
    ).toBeInTheDocument();

    fireEvent.click(
      within(mobileAIList).getByRole("button", {
        name: "Software Architect options",
      }),
    );

    expect(within(mobileAIList).getByText("View details")).toBeInTheDocument();
    expect(within(mobileAIList).getByText("Edit")).toBeInTheDocument();
    expect(within(mobileAIList).getByText("Remove")).toBeInTheDocument();
  });

  it("opens edit from the mobile AI instance list", async () => {
    seedChatRooms([
      {
        id: "room-1",
        title: "Launch Plan",
        aiInstances: [
          {
            id: "architect",
            name: "Software Architect",
            instructions: "Focus on technical feasibility.",
          },
        ],
      },
    ]);

    render(<ChatShell />);

    await waitFor(() => {
      expect(screen.getByText("1 AI instance")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Show added AI instances" }),
    );
    const mobileAIList = screen.getByRole("region", {
      name: "Added AI instances",
    });
    fireEvent.click(
      within(mobileAIList).getByRole("button", {
        name: "Software Architect options",
      }),
    );
    fireEvent.click(within(mobileAIList).getByText("Edit"));

    expect(
      screen.getByRole("dialog", { name: "Edit AI Instance" }),
    ).toBeInTheDocument();
  });

  it("keeps the edit dialog open while editing fields", async () => {
    seedChatRooms([
      {
        id: "room-1",
        title: "Launch Plan",
        aiInstances: [
          {
            id: "architect",
            name: "Software Architect",
            instructions: "Focus on technical feasibility.",
          },
        ],
      },
    ]);

    render(<ChatShell />);

    await waitFor(() => {
      expect(screen.getByText("1 AI instance")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Show added AI instances" }),
    );
    const mobileAIList = screen.getByRole("region", {
      name: "Added AI instances",
    });
    fireEvent.click(
      within(mobileAIList).getByRole("button", {
        name: "Software Architect options",
      }),
    );
    fireEvent.click(within(mobileAIList).getByText("Edit"));

    const dialog = screen.getByRole("dialog", { name: "Edit AI Instance" });
    const nameInput = within(dialog).getByLabelText("Name");

    fireEvent.click(nameInput);
    fireEvent.change(nameInput, {
      target: { value: "Systems Reviewer" },
    });

    expect(
      screen.getByRole("dialog", { name: "Edit AI Instance" }),
    ).toBeInTheDocument();
    expect(nameInput).toHaveValue("Systems Reviewer");
  });

  it("removes an AI instance from the mobile AI instance list", async () => {
    seedChatRooms([
      {
        id: "room-1",
        title: "Launch Plan",
        aiInstances: [
          {
            id: "architect",
            name: "Software Architect",
            instructions: "Focus on technical feasibility.",
          },
          {
            id: "skeptic",
            name: "Skeptic",
            instructions: "Focus on risks.",
          },
        ],
      },
    ]);

    render(<ChatShell />);

    await waitFor(() => {
      expect(screen.getByText("2 AI instances")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Show added AI instances" }),
    );
    const mobileAIList = screen.getByRole("region", {
      name: "Added AI instances",
    });
    fireEvent.click(
      within(mobileAIList).getByRole("button", { name: "Skeptic options" }),
    );
    fireEvent.click(within(mobileAIList).getByText("Remove"));

    expect(screen.getByText("1 AI instance")).toBeInTheDocument();
  });

  it("shows a mobile chat room navigation button when a room is active", () => {
    render(<ChatShell />);

    createRoomFromEmptyState();

    expect(
      screen.getByRole("button", { name: "Open chat room navigation" }),
    ).toBeInTheDocument();
  });

  it("opens the mobile drawer with chat rooms and new room action", async () => {
    seedChatRooms([
      { id: "room-1", title: "Launch Plan" },
      { id: "room-2", title: "Pricing Review" },
    ]);

    render(<ChatShell />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Launch Plan" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Open chat room navigation" }),
    );

    const drawer = getMobileDrawer();

    expect(
      within(drawer).getByRole("button", { name: "+ New chat room" }),
    ).toBeInTheDocument();
    expect(within(drawer).getByText("Launch Plan")).toBeInTheDocument();
    expect(within(drawer).getByText("Pricing Review")).toBeInTheDocument();
  });

  it("selects a room from the mobile drawer and closes it", async () => {
    seedChatRooms([
      { id: "room-1", title: "Launch Plan" },
      { id: "room-2", title: "Pricing Review" },
    ]);

    render(<ChatShell />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Launch Plan" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Open chat room navigation" }),
    );
    fireEvent.click(within(getMobileDrawer()).getByText("Pricing Review"));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Pricing Review" }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: "Close chat room navigation" }),
    ).not.toBeInTheDocument();
  });

  it("shows chat room options on each chat room row instead of the header", async () => {
    seedChatRooms([{ id: "room-1", title: "Launch Plan" }]);

    render(<ChatShell />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Launch Plan" }),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", { name: "Chat room options" }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Launch Plan options" }),
    );

    expect(screen.getByText("Rename")).toBeInTheDocument();
    expect(screen.getByText("Clear messages")).toBeInTheDocument();
    expect(screen.getByText("Delete chat room")).toBeInTheDocument();
  });

  it("creates a room from the mobile drawer and closes it", async () => {
    seedChatRooms([{ id: "room-1", title: "Launch Plan" }]);

    render(<ChatShell />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Launch Plan" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Open chat room navigation" }),
    );
    fireEvent.click(
      within(getMobileDrawer()).getByRole("button", {
        name: "+ New chat room",
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Untitled chat room" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Close chat room navigation" }),
    ).not.toBeInTheDocument();
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

    response.resolve(
      createMockStreamResponse([
        {
          type: "done",
          message: {
            id: "ai-response",
            authorType: "ai",
            role: "Software Architect",
            content: "Start with the integration boundary.",
          },
        },
      ]),
    );

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

    fireEvent.click(screen.getByRole("button", { name: "Test Room options" }));
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

function getMobileDrawer() {
  const sidebars = screen.getAllByLabelText("Chat rooms");

  return sidebars[sidebars.length - 1];
}

function seedChatRooms(
  rooms: Array<{
    id: string;
    title: string;
    aiInstances?: Array<{
      id: string;
      name: string;
      instructions: string;
      description?: string;
    }>;
  }>,
) {
  window.localStorage.setItem(
    "council-ai-chat-rooms",
    JSON.stringify({
      activeRoomId: rooms[0].id,
      chatRooms: rooms.map((room) => ({
        id: room.id,
        title: room.title,
        aiInstances: room.aiInstances ?? [],
        messages: [],
        canSummarize: false,
      })),
    }),
  );
}
