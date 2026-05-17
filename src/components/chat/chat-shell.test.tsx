import { fireEvent, render, screen } from "@testing-library/react";
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
});
