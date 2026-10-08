#!/usr/bin/env bash
# Translate native payloads to the existing Public policies; keep their enforcement decisions unchanged.
set -euo pipefail
repo=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
[[ $# == 1 ]] || exit 2
policy=$1
case "$policy" in
require-hippo-boundary | block-env-file-access | remind-rules-propagation | format-lint-markdown)
	delegate=(bash "$repo/.claude/hooks/$policy.sh")
	;;
*) exit 2 ;;
esac
export CLAUDE_PROJECT_DIR="$repo"
# Retain native fields while supplying the canonical fields existing delegates consume.
# Shell argv uses the native runtime's quoted command assembly, never eval.
if ! mapped=$(jq -c 'def shell_arg: if test("^[A-Za-z0-9_@%+=:,./-]+$") then . else @sh end;
  .tool_name as $native |
  .tool_name = ({shell_command:"Bash",read_file:"Read",read_multiple_files:"Read",read_directory:"Read",
    grep:"Read",glob:"Read",write_file:"Write",edit_file:"Edit"}[$native] // $native) |
  if $native == "shell_command" then
    .tool_input.workdir = (.tool_input.cwd // .tool_input.directory // .tool_input.workdir // .cwd) |
    .tool_input.command = ((.tool_input.command // "") +
      (if (.tool_input.args // [] | length) > 0 then
        " " + (.tool_input.args | map(shell_arg) | join(" ")) else "" end))
  elif $native == "read_multiple_files" then
    (.tool_input.paths // .tool_input.file_paths // .tool_input.file_path // []) as $paths |
    (if ($paths | type) == "array" then $paths else [$paths] end)[] as $path |
    .tool_input.file_path = $path
  else .tool_input.file_path = (.tool_input.file_path // .tool_input.path) end' 2>/dev/null); then
	printf '%s\n' 'Invalid Command Code hook payload.' >&2
	exit 2
fi
while IFS= read -r payload; do
	[[ -n $payload ]] || continue
	execution_dir=$(jq -r 'if .tool_name == "Bash" then .tool_input.workdir // empty else empty end' <<<"$payload")
	# Only a Markdown mutation requests formatter admission. Other tools remain no-ops.
	admission_class=""
	if [[ $policy == format-lint-markdown ]] &&
		[[ $(jq -r '.tool_input.file_path // empty' <<<"$payload") == *.md ]]; then
		admission_class=transactional
	fi
	output=$(
		# Bash 3.2 substitutions do not inherit errexit. Refuse a failed cwd before any delegate or admission.
		if [[ -n $execution_dir ]]; then
			cd -- "$execution_dir" || exit 2
		fi
		if [[ -n $admission_class ]]; then
			printf '%s' "$payload" | "$repo/hippo" run --class "$admission_class" --resource-tier standard \
				--disk-path "$repo" -- "${delegate[@]}"
		else
			printf '%s' "$payload" | "${delegate[@]}"
		fi
	)
	# A multi-read is allowed only if every path passes; an earlier denial cannot be lost.
	if [[ -n $output ]]; then
		printf '%s\n' "$output"
		exit 0
	fi
done <<<"$mapped"
