#!/usr/bin/env bash
# PreToolUse reminder: a write to any repo-rules surface should go through the
# rules-propagation workflow rather than an ad-hoc edit.
#
# WARN-ONLY BY DESIGN. This hook never denies and never grants: it exits 0 on every path so it
# cannot deadlock the propagation workflow's own Step 6 writes, and it emits no permission
# decision so it cannot auto-approve an edit that would otherwise have prompted.
#
# The reminder is emitted as hookSpecificOutput.additionalContext, NOT as plain stdout. For
# PreToolUse, plain-text stdout on exit 0 reaches only the debug log -- not the transcript and not
# the agent -- so a plain-text reminder here is silently inert. additionalContext is the one
# mechanism that reaches the agent without blocking the call.
#
# The guarded set is the "repo rules" in-scope table from
# repo-governance/glossary/repo-rules-scope.md — governance prose, the instruction surfaces,
# agent and skill definitions, the generated mirrors, the machine-readable declarations, the
# enforcement wiring, and the language style guides. One definition, two consumers.
set -euo pipefail

input="$(cat)"
tool_name="$(printf '%s' "$input" | jq -r '.tool_name // empty')"

# Only write-shaped tools matter. Reading a rule surface is not rule work.
#
# Bash is included deliberately: an edit made with sed -i, tee, a redirect, or a Python heredoc
# never touches Edit/Write, so a guard watching only those tools misses the most common way an
# agent actually writes a file. The env-file guard carries a Bash branch for the same reason.
case "$tool_name" in
Write | Edit | MultiEdit | Bash) ;;
*) exit 0 ;;
esac

if [ "$tool_name" = "Bash" ]; then
	command_str="$(printf '%s' "$input" | jq -r '.tool_input.command // empty')"
	[ -z "$command_str" ] && exit 0

	# Read-only inspection of a rule surface is not rule work, so require a write-shaped verb
	# before looking for a guarded path. Over-inclusive on purpose: this guard only ever warns,
	# so a false positive costs a line of output while a false negative costs the whole guard.
	#
	# Stderr plumbing is stripped first. `2>/dev/null`, `2>&1` and `>&2` appear on read-only
	# commands constantly, and a guard that fires on every `grep ... 2>/dev/null` becomes noise
	# the agent learns to skip -- which costs more than the false negatives it prevents.
	# Arrow literals (`->`, `=>`) are stripped for the same reason: they are punctuation in prose
	# and log output, not redirects, and they appear constantly in echoed progress messages.
	verb_probe="$(printf '%s' "$command_str" | sed -E 's/[-=]>//g; s/[0-9]*>&[0-9-]+//g; s/[0-9]+>[[:space:]]*[^[:space:]]+//g; s/&>[[:space:]]*[^[:space:]]+//g')"

	if ! printf '%s' "$verb_probe" |
		grep -qE '(>|>>|\bsed\b[^|]*-i|\btee\b|\bmv\b|\bcp\b|\brm\b|\btruncate\b|\bdd\b)'; then
		exit 0
	fi
	file_path="$command_str"
else
	file_path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')"
	[ -z "$file_path" ] && exit 0
fi

# Compare on the repo-relative path: an absolute path matches every rule whose pattern appears
# anywhere in the prefix, which would fire on unrelated files under a similarly-named directory.
project_dir="${CLAUDE_PROJECT_DIR:-$PWD}"
rel="${file_path#"$project_dir"/}"

# File-tool paths are matched as prefixes; a Bash command is one string, so the same families are
# matched anywhere inside it.
RULE_SURFACES='repo-governance/|AGENTS\.md|CLAUDE\.md|\.claude/agents/|\.claude/skills/|\.opencode/|\.codex/|\.agents/|repo-config\.yml|\.husky/|\.github/workflows/|docs/explanation/software-engineering/'

is_rule_surface() {
	if [ "$tool_name" = "Bash" ]; then
		printf '%s' "$1" | grep -qE "$RULE_SURFACES"
		return $?
	fi
	case "$1" in
	repo-governance/*) return 0 ;;
	AGENTS.md | CLAUDE.md) return 0 ;;
	.claude/agents/* | .claude/skills/*) return 0 ;;
	.opencode/* | .codex/* | .agents/*) return 0 ;;
	repo-config.yml) return 0 ;;
	.husky/*) return 0 ;;
	.github/workflows/*) return 0 ;;
	docs/explanation/software-engineering/*) return 0 ;;
	*) return 1 ;;
	esac
}

if is_rule_surface "$rel"; then
	# jq -Rs builds a correctly-escaped JSON string from the message, so the payload stays valid
	# regardless of quoting or newlines in the text.
	reminder="$(
		cat <<'TXT'
[rules-propagation] this write targets a repo-rules surface.

Rule work runs through repo-governance/workflows/quality/rules-propagation.md, not an ad-hoc
edit: normalize the rule so it is falsifiable, scan for contradictions under layer-aware
precedence before writing, place it on the narrowest surface that binds (evicting from the
instruction surface if admitted there), tidy every other surface stating its subject, and record
an enforcement disposition.

Already inside a propagation run, or making a genuinely mechanical fix? Continue -- this is a
reminder, not a gate.
TXT
	)"
	printf '%s' "$reminder" | jq -Rs '{
		hookSpecificOutput: {
			hookEventName: "PreToolUse",
			additionalContext: .
		}
	}'
fi

exit 0
