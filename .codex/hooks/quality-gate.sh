#!/usr/bin/env bash
set -u

# Codex passes hook input as JSON on stdin. Read it so stdin is drained even
# though this hook does not need to inspect the payload.
hook_input="$(cat)"
_unused_hook_input="$hook_input"

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
log_file="$(mktemp "${TMPDIR:-/tmp}/council-ai-quality-gate.XXXXXX.log")"
trap 'rm -f "$log_file"' EXIT

log() {
  echo "$@" >>"$log_file"
}

emit_log() {
  cat "$log_file" >&2
}

allow_stop() {
  printf '{}\n'
  exit 0
}

block_stop() {
  printf '{"decision":"block","reason":"Quality gate failed. See hook stderr output for details."}\n'
  exit 0
}

if ! cd "$repo_root"; then
  log "[quality-gate] FAIL: could not cd to repo root: $repo_root"
  emit_log
  block_stop
fi

log "[quality-gate] Repo: $repo_root"

if [ ! -f package.json ]; then
  log "[quality-gate] SKIP: package.json not found."
  emit_log
  allow_stop
fi

has_app_changes() {
  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    return 0
  fi

  git status --porcelain -- \
    package.json \
    package-lock.json \
    tsconfig.json \
    next.config.ts \
    eslint.config.mjs \
    vitest.config.mts \
    postcss.config.mjs \
    src \
    test \
    | grep -q .
}

if ! has_app_changes; then
  log "[quality-gate] SKIP: no app, test, or build config changes detected."
  emit_log
  allow_stop
fi

has_script() {
  node -e 'const scripts = require("./package.json").scripts || {}; process.exit(Object.prototype.hasOwnProperty.call(scripts, process.argv[1]) ? 0 : 1)' "$1"
}

run_script() {
  script_name="$1"
  log "[quality-gate] RUN: npm run $script_name"

  if npm run "$script_name" >>"$log_file" 2>&1; then
    log "[quality-gate] PASS: npm run $script_name"
    return 0
  fi

  log "[quality-gate] FAIL: npm run $script_name"
  return 1
}

if has_script quality; then
  if run_script quality; then
    emit_log
    allow_stop
  fi

  emit_log
  block_stop
fi

log "[quality-gate] INFO: npm run quality is not defined. Running available individual checks."

ran_any=0
failed=0

for script_name in lint typecheck test; do
  if has_script "$script_name"; then
    ran_any=1
    run_script "$script_name" || failed=1
  else
    log "[quality-gate] SKIP: npm run $script_name is not defined."
  fi
done

if [ "$ran_any" -eq 0 ]; then
  log "[quality-gate] SKIP: no quality scripts found."
  emit_log
  allow_stop
fi

if [ "$failed" -ne 0 ]; then
  log "[quality-gate] FAIL: one or more quality checks failed."
  emit_log
  block_stop
fi

log "[quality-gate] PASS: all available quality checks passed."
emit_log
allow_stop
