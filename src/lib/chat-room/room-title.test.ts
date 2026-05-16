import { deriveChatRoomTitle } from "./room-title";

describe("deriveChatRoomTitle", () => {
  it("normalizes whitespace in a short first user message", () => {
    expect(deriveChatRoomTitle("  Should   we launch this quarter?  ")).toBe(
      "Should we launch this quarter?",
    );
  });

  it("truncates a long first user message", () => {
    expect(
      deriveChatRoomTitle(
        "Should we launch the partner pilot this quarter with only one integration?",
      ),
    ).toBe("Should we launch the partner pi...");
  });
});
