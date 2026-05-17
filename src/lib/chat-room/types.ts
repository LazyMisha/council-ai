export type PredefinedRoleKey =
  | "Software Architect"
  | "Business Analyst"
  | "Skeptic"
  | "Optimist"
  | "Product Expert"
  | "Critic";

export type AIInstance = {
  id: string;
  name: string;
  instructions: string;
  description?: string;
};

export type Message = {
  id: string;
  authorType: "user" | "ai" | "system" | "summary";
  content: string;
  role?: string;
};

export type ChatRoom = {
  id: string;
  title: string;
  aiInstances: AIInstance[];
  messages: Message[];
};

export type RoleProfile = {
  name: PredefinedRoleKey;
  description: string;
  instructions: string;
};
