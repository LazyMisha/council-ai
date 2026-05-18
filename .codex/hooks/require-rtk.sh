#!/usr/bin/env bash
set -u

hook_input="$(cat)"

allow_tool() {
  printf '{}\n'
  exit 0
}

block_tool() {
  reason="$1"
  printf '{"decision":"block","reason":"%s"}\n' "$reason"
  exit 0
}

command_text="$(
  HOOK_INPUT="$hook_input" node -e '
    const input = JSON.parse(process.env.HOOK_INPUT || "{}");
    const toolInput = input.tool_input || input.toolInput || {};
    const command = toolInput.command || input.command || "";
    process.stdout.write(typeof command === "string" ? command.trim() : "");
  ' 2>/dev/null
)"

if [ -z "$command_text" ]; then
  allow_tool
fi

first_word="${command_text%%[[:space:]]*}"

if [ "$first_word" = "rtk" ]; then
  allow_tool
fi

block_tool "Shell commands in this workspace must start with rtk. Retry as: rtk $command_text"
