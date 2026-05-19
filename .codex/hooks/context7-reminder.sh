#!/usr/bin/env bash
set -u

hook_input="$(cat)"

HOOK_INPUT="$hook_input" node <<'NODE'
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const allowTool = () => {
  process.stdout.write("{}\n");
};

const blockTool = (reason) => {
  process.stdout.write(`${JSON.stringify({ decision: "block", reason })}\n`);
};

let input = {};

try {
  input = JSON.parse(process.env.HOOK_INPUT || "{}");
} catch {
  allowTool();
  process.exit(0);
}

const toolName = String(
  input.tool_name || input.toolName || input.tool || input.name || "",
);
const toolInput = input.tool_input || input.toolInput || input.input || {};
const commandText = String(toolInput.command || input.command || "").trim();
const rawInput = JSON.stringify(input).toLowerCase();
const normalizedToolName = toolName.toLowerCase();

const isContext7Tool =
  normalizedToolName.includes("context7") || rawInput.includes("mcp__context7__");

const isBashTool = /^(bash|shell)$/i.test(toolName);
const isEditTool =
  /^(edit|write|multiedit|apply_patch|functions\.apply_patch)$/i.test(toolName) ||
  normalizedToolName.includes("apply_patch");

const mutatingBashPattern =
  /\b(apply_patch|npm\s+(install|i)|pnpm\s+add|yarn\s+add|touch|mkdir|mv|cp|rm|chmod|git\s+add|git\s+commit|graphify\s+update)\b/i;

const isImplementationTool =
  isEditTool || (isBashTool && mutatingBashPattern.test(commandText));

if (!isImplementationTool || isContext7Tool) {
  allowTool();
  process.exit(0);
}

const repoRoot = String(input.cwd || process.cwd());
const repoKey = crypto
  .createHash("sha256")
  .update(repoRoot)
  .digest("hex")
  .slice(0, 16);
const sessionSource = String(
  input.session_id || input.sessionId || input.transcript_path || "manual",
);
const sessionKey = crypto
  .createHash("sha256")
  .update(sessionSource)
  .digest("hex")
  .slice(0, 16);
const stateDir = path.join(
  "/private/tmp",
  "codex-context7-pretooluse",
  repoKey,
);
const stampPath = path.join(stateDir, `context7-reminded-${sessionKey}`);

if (fs.existsSync(stampPath)) {
  allowTool();
  process.exit(0);
}

try {
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(stampPath, new Date().toISOString());
} catch {
  // Hooks must return valid JSON even if state cannot be written.
}

blockTool(
  "Before implementation, decide whether fresh docs are needed. Use Context7 MCP first for library-specific code: Next.js App Router, React, Tailwind, Prisma, Supabase, OpenAI SDK, Vitest, or Testing Library. If this edit is not library-specific, retry now and continue.",
);
NODE
