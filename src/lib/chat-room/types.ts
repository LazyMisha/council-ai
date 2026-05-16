export type RoleKey =
  | "Software Architect"
  | "Business Analyst"
  | "Skeptic"
  | "Optimist"
  | "Product Expert"
  | "Critic";

export type AIInstance = {
  id: string;
  role: RoleKey;
};

export type Message = {
  id: string;
  authorType: "user" | "ai" | "system";
  content: string;
  role?: RoleKey;
};

export type ChatRoom = {
  id: string;
  title: string;
  aiInstances: AIInstance[];
  messages: Message[];
};
