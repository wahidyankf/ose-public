#!/usr/bin/env bash
# Claude Code PreToolUse hook: warm Nx cache before git push
#
# The pre-push git hook (.husky/pre-push) runs `./rhino gate run --surface pre-push`,
# whose registry gate delegates to `apps/rhino-cli/scripts/rhino-bin.sh gate run
# --surface=pre-push`, which executes every registry-declared pre-push-surface gate. This hook warms the Nx cache for the
# affected-projects-scoped subset (the only gates `nx affected` actually caches — the
# other pre-push gates are direct CLI validators, not Nx targets) so the real pre-push
# hook hits cached results and completes in seconds instead of taking 20+ minutes on a
# cold cache in this polyglot monorepo.
#
# The target list is derived live from the registry via `gate list --surface=pre-push`,
# not hardcoded — a hardcoded list (typecheck/lint/test:quick) previously went stale
# when the registry changed to a 14-gate pre-push surface. We use `--format=text`
# rather than `--format=json`: the JSON projection deliberately omits `hand-wired`
# gates (see apps/rhino-cli/src/commands/gate/list.rs, `format_json_omits_hand_wired`),
# but the affected-projects-scoped, Nx-cacheable gates this script needs are exactly
# the hand-wired ones — only `--format=text` includes them.
#
# Key: we source ~/.zshrc to pick up the correct PATH for all tools
# (dotnet, uv, oapi-codegen, sdkman, pyenv, cargo, etc.) which the
# git hook's /bin/sh environment may not have.

set -euo pipefail

# --- Parse stdin JSON to check if this is a git push command ---
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

# Only intercept git push commands (not other bash commands)
if ! echo "$COMMAND" | grep -qE '^\s*git\s+push\b'; then
	exit 0
fi

echo "Warming Nx cache before push (mirrors .husky/pre-push)..." >&2

# --- Source user environment for all polyglot tools ---
# shellcheck disable=SC1091
if [ -f "$HOME/.zshrc" ]; then
	# Use zsh to properly source .zshrc (it may use zsh-specific syntax)
	ENV_EXPORTS=$(zsh -c 'source ~/.zshrc 2>/dev/null; env' 2>/dev/null || true)
	# Extract key PATH and tool variables
	NEW_PATH=$(echo "$ENV_EXPORTS" | grep '^PATH=' | head -1 | cut -d= -f2-)
	NEW_DOTNET_ROOT=$(echo "$ENV_EXPORTS" | grep '^DOTNET_ROOT=' | head -1 | cut -d= -f2-)
	NEW_JAVA_HOME=$(echo "$ENV_EXPORTS" | grep '^JAVA_HOME=' | head -1 | cut -d= -f2-)
	if [ -n "$NEW_PATH" ]; then export PATH="$NEW_PATH"; fi
	if [ -n "$NEW_DOTNET_ROOT" ]; then export DOTNET_ROOT="$NEW_DOTNET_ROOT"; fi
	if [ -n "$NEW_JAVA_HOME" ]; then export JAVA_HOME="$NEW_JAVA_HOME"; fi
fi

# Ensure standalone tool paths are available
export PATH="$HOME/.local/bin:$HOME/go/bin:$PATH"

# Set JAVA_HOME_21_X64 for Clojure/Gradle (mirrors CI)
if [ -d "$HOME/.sdkman/candidates/java/21.0.1-tem" ]; then
	export JAVA_HOME_21_X64="$HOME/.sdkman/candidates/java/21.0.1-tem"
fi

# Activate JDK 25 if available (mirrors CI's default Java)
JAVA25_HOME=$(find "$HOME/.sdkman/candidates/java" -maxdepth 1 -name "25.*" -type d 2>/dev/null | head -1)
if [ -n "$JAVA25_HOME" ]; then
	export JAVA_HOME="$JAVA25_HOME"
	export PATH="$JAVA_HOME/bin:$PATH"
fi

# --- Compute parallelism (same formula as .husky/pre-push) ---
PARALLEL=$(($(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4) - 1))

# --- Derive the warm-target list live from the pre-push gate registry ---
# Column 3 is the command (Nx target name for affected-projects-scoped gates), column
# 4 is the scope. Only affected-projects-scoped gates are Nx targets worth warming.
GATE_ROWS=$(apps/rhino-cli/scripts/rhino-bin.sh gate list --surface=pre-push --format=text 2>/dev/null || true)
TARGETS=$(printf '%s\n' "$GATE_ROWS" | awk -F'\t' '$4 == "affected-projects" { print $3 }' | sort -u | tr '\n' ' ' | sed 's/ *$//')

if [ -z "$TARGETS" ]; then
	echo "warm-cache-before-push: no affected-projects-scoped pre-push gates found via" >&2
	echo "  'gate list --surface=pre-push --format=text' — skipping cache warm (this is" >&2
	echo "  a registry-drift signal, not a push blocker; the real pre-push hook still runs)." >&2
	exit 0
fi

# --- Run the live pre-push registry's Nx-cacheable targets ---
echo "Running: npx nx affected -t $TARGETS --parallel=$PARALLEL" >&2
# shellcheck disable=SC2086
npx nx affected -t $TARGETS --parallel="$PARALLEL" 2>&1 || true

echo "Cache warming complete. Pre-push hook should now hit cache." >&2

# Always exit 0 — this is a cache-warming optimization, not a gate.
# The actual pre-push git hook is the real quality gate.
exit 0
