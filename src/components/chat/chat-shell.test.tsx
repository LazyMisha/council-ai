import { render, screen } from "@testing-library/react";
import { ChatShell } from "./chat-shell";

describe("ChatShell", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the default chat room title", () => {
    render(<ChatShell />);

    expect(
      screen.getByRole("heading", { name: "Partner pilot launch" }),
    ).toBeInTheDocument();
  });

  it("renders AI instance option buttons for the default room", () => {
    render(<ChatShell />);

    expect(
      screen.getByRole("button", { name: "Software Architect options" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Business Analyst options" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Skeptic options" }),
    ).toBeInTheDocument();
  });

  it("shows the message input with the correct placeholder", () => {
    render(<ChatShell />);

    expect(
      screen.getByPlaceholderText("Start a topic or reply..."),
    ).toBeInTheDocument();
  });

  it("shows the send button and add-ai button", () => {
    render(<ChatShell />);

    expect(screen.getByText("Send")).toBeInTheDocument();
    expect(screen.getByText("+ Add AI")).toBeInTheDocument();
  });
});
