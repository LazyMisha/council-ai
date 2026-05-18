export type RoleAccent = {
  text: string;
  bg: string;
  border: string;
  dot: string;
};

const predefinedAccents: Record<string, RoleAccent> = {
  "Software Architect": {
    text: "#4a6fa5",
    bg: "#eef2f8",
    border: "#c5d3e8",
    dot: "#6f95bd",
  },
  "Business Analyst": {
    text: "#5e7a4a",
    bg: "#f0f4ec",
    border: "#c8d4b8",
    dot: "#7d8f65",
  },
  Skeptic: {
    text: "#5c5852",
    bg: "#f2f0ed",
    border: "#c9c4bc",
    dot: "#8a8172",
  },
  Optimist: {
    text: "#9a7b3c",
    bg: "#f9f3e6",
    border: "#e6d5b3",
    dot: "#d8a84f",
  },
  "Product Expert": {
    text: "#a85c3e",
    bg: "#f9ece6",
    border: "#e8cbbd",
    dot: "#c96442",
  },
  Critic: {
    text: "#9a5a52",
    bg: "#f8edeb",
    border: "#e4c5bf",
    dot: "#b86b61",
  },
};

const customPalette: RoleAccent[] = [
  {
    text: "#6b8fa8",
    bg: "#edf3f7",
    border: "#c2d6e3",
    dot: "#6b8fa8",
  },
  {
    text: "#7a8e5e",
    bg: "#f1f4ec",
    border: "#c5d1b3",
    dot: "#7a8e5e",
  },
  {
    text: "#9e7d45",
    bg: "#f8f2e6",
    border: "#e3d3b3",
    dot: "#9e7d45",
  },
  {
    text: "#8b6b5e",
    bg: "#f5ede9",
    border: "#d9c8be",
    dot: "#8b6b5e",
  },
  {
    text: "#6e7b8e",
    bg: "#edf0f4",
    border: "#c1cad6",
    dot: "#6e7b8e",
  },
  {
    text: "#8c7d60",
    bg: "#f5f2eb",
    border: "#ddd6c4",
    dot: "#8c7d60",
  },
];

function hashString(input: string): number {
  let hash = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  return Math.abs(hash);
}

export function getRoleAccent(name: string): RoleAccent {
  const predefined = predefinedAccents[name];

  if (predefined) {
    return predefined;
  }

  const index = hashString(name) % customPalette.length;

  return customPalette[index];
}
