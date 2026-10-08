#!/usr/bin/env bash
# Synthetic repository transport proof; run under an admitted finite owned process deadline.
set -euo pipefail
repo=$(cd "$(dirname "$0")/../.." && pwd)
bridge="$repo/.commandcode/hooks/run-policy-hook.sh"
if [[ ! -f $bridge ]]; then
	printf '%s\n' 'FAIL: required native policy adapter is missing'
	exit 1
fi
command -v jq >/dev/null
scratch=$(mktemp -d)
scratch=$(cd "$scratch" && pwd -P)
cleanup() {
	# Only this freshly allocated root is removed; restore the one test-owned restricted directory first.
	[[ ! -d $scratch/inaccessible ]] || chmod 700 "$scratch/inaccessible"
	rm -rf -- "$scratch"
}
trap cleanup EXIT
pass=0
fail=0
check() {
	local label=$1
	shift
	if "$@" >/dev/null; then
		pass=$((pass + 1))
	else
		printf 'FAIL: %s\n' "$label"
		fail=$((fail + 1))
	fi
}
fixture="$scratch/repository"
mkdir -p "$fixture/.commandcode/hooks" "$fixture/.claude/hooks" "$scratch/session" "$scratch/empty-template"
cp "$bridge" "$fixture/.commandcode/hooks/"
# Only read-only Git metadata queries are needed. Build the minimal repository in
# the freshly owned root instead of allowing an unguarded git init write.
[[ $(cd "$fixture" && pwd -P) == "$scratch/repository" && ! -e $fixture/.git ]] || exit 1
mkdir -p "$fixture/.git/objects" "$fixture/.git/refs"
printf 'ref: refs/heads/main\n' >"$fixture/.git/HEAD"
printf '[core]\n\tbare = false\n\tworktree = ..\n' >"$fixture/.git/config"
# Keep the user's HOME unchanged. Blank Git config and drop every inherited Git
# location/config selector for setup, delegates and capture command substitution.
# GIT_WORK_TREE stays unset so the root check cannot merely echo our expectation.
fixture_environment=(env -i "PATH=$PATH" "HOME=${HOME:-}" LC_ALL=C
	"GIT_DIR=$fixture/.git" "GIT_CEILING_DIRECTORIES=$scratch"
	GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null GIT_CONFIG_NOSYSTEM=1
	"GIT_TEMPLATE_DIR=$scratch/empty-template")
resolved_root=$("${fixture_environment[@]}" git -C "$fixture" rev-parse --show-toplevel)
[[ $(cd "$resolved_root" && pwd -P) == "$fixture" ]] || exit 1
resolved_git=$("${fixture_environment[@]}" git -C "$fixture" rev-parse --absolute-git-dir)
[[ $(cd "$resolved_git" && pwd -P) == "$fixture/.git" ]] || exit 1
for policy in require-hippo-boundary block-env-file-access; do
	cp "$repo/.claude/hooks/$policy.sh" "$fixture/.claude/hooks/"
done
cat >"$fixture/hippo" <<'ADMISSION'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$@" >"${BASH_SOURCE[0]}.args"
while [[ $# -gt 0 && $1 != -- ]]; do shift; done
[[ $# -gt 1 ]] || exit 2
shift
exec "$@"
ADMISSION
chmod +x "$fixture/hippo"
touch "$fixture/hippo.lock"
cat >"$fixture/.claude/hooks/remind-rules-propagation.sh" <<'DELEGATE'
#!/usr/bin/env bash
set -euo pipefail
jq -c --arg context "$CLAUDE_PROJECT_DIR" '. + {delegate_context:$context}'
DELEGATE
run_bridge() {
	local policy=$1 payload=$2
	code=0
	out=$(cd "$scratch/session" && printf '%s' "$payload" | "${fixture_environment[@]}" \
		/bin/bash "$fixture/.commandcode/hooks/run-policy-hook.sh" "$policy" \
		2>"$scratch/errors") || code=$?
	if [[ ${3:-success} == success ]]; then
		check "$policy returns successful status for legitimate transport" test "$code" -eq 0
	fi
}
run_bridge remind-rules-propagation '{"tool_name":"write_file","tool_input":{"path":"README.md","content":"synthetic"}}'
check 'write fields and owning checkout reach the delegate' jq -e --arg repo "$fixture" \
	'.tool_name == "Write" and .tool_input.file_path == "README.md" and .tool_input.content == "synthetic" and .delegate_context == $repo' <<<"$out"
run_bridge remind-rules-propagation "$(jq -nc --arg cwd "$fixture" '{tool_name:"shell_command",tool_input:{command:"printf",args:["%s","two words","a\u0027b"],cwd:$cwd}}')"
expected_command=$(
	cat <<'COMMAND'
printf %s 'two words' 'a'\''b'
COMMAND
)
check 'quoted native argv is retained and assembled' jq -e --arg expected "$expected_command" \
	'.tool_name == "Bash" and .tool_input.args == ["%s","two words","a\u0027b"] and .tool_input.command == $expected and .tool_input.workdir == .tool_input.cwd' <<<"$out"
run_bridge require-hippo-boundary "$(jq -nc --arg cwd "$fixture" '{tool_name:"shell_command",tool_input:{command:"npm",args:["install"],cwd:$cwd}}')"
check 'existing policy denies unguarded native compute' jq -e '.hookSpecificOutput.permissionDecision == "deny"' <<<"$out"
run_bridge require-hippo-boundary "$(jq -nc --arg cwd "$fixture" '{tool_name:"shell_command",tool_input:{command:"./hippo run --class ephemeral --resource-tier light --disk-path . -- npm install",cwd:$cwd}}')"
check 'existing outer boundary is permitted' test -z "$out"
run_bridge require-hippo-boundary "$(jq -nc --arg cwd "$fixture" '{tool_name:"shell_command",tool_input:{command:"npm",args:["run","check:complete"],cwd:$cwd}}')"
check 'already guarded package script is permitted' test -z "$out"
for tool in read_file write_file edit_file grep glob; do
	run_bridge block-env-file-access "$(jq -nc --arg tool "$tool" '{tool_name:$tool,tool_input:{path:"/synthetic/.env.prod"}}')"
	check "existing env policy denies $tool" jq -e '.hookSpecificOutput.permissionDecision == "deny"' <<<"$out"
done
for paths in '["/synthetic/.env.prod","/synthetic/README.md"]' '["/synthetic/README.md","/synthetic/.env.stag"]'; do
	run_bridge block-env-file-access "$(jq -nc --argjson paths "$paths" '{tool_name:"read_multiple_files",tool_input:{paths:$paths}}')"
	check 'multi-read preserves the first denial in either path order' jq -e '.hookSpecificOutput.permissionDecision == "deny"' <<<"$out"
done
run_bridge block-env-file-access '{"tool_name":"read_file","tool_input":{"path":"/synthetic/.env.example"}}'
check 'template remains allowed' test -z "$out"
run_bridge block-env-file-access '{"tool_name":"shell_command","tool_input":{"command":"cat","args":["/synthetic/.env.stag"]}}'
check 'env policy examines assembled shell argv' jq -e '.hookSpecificOutput.permissionDecision == "deny"' <<<"$out"
cat >"$fixture/.claude/hooks/format-lint-markdown.sh" <<'DELEGATE'
#!/usr/bin/env bash
set -euo pipefail
cat
DELEGATE
run_bridge format-lint-markdown '{"tool_name":"write_file","tool_input":{"path":"README.md","content":"synthetic"}}'
check 'formatter receives unchanged write fields' jq -e '.tool_name == "Write" and .tool_input.content == "synthetic"' <<<"$out"
check 'formatter uses one transactional standard boundary' jq -e -Rn \
	'[inputs] as $a | $a[0:5] == ["run","--class","transactional","--resource-tier","standard"] and ($a | map(select(. == "run")) | length) == 1' <"$fixture/hippo.args"
rm -- "$fixture/hippo.args"
run_bridge format-lint-markdown '{"tool_name":"edit_file","tool_input":{"path":"fixture.txt"}}'
check 'non-markdown edit requests no admission' test ! -e "$fixture/hippo.args"
for policy in require-hippo-boundary block-env-file-access remind-rules-propagation format-lint-markdown; do
	cat >"$fixture/.claude/hooks/$policy.sh" <<'DELEGATE'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$PWD" >"$CLAUDE_PROJECT_DIR/delegate.effect"
cat
DELEGATE
done
mkdir -p "$fixture/working directory" "$scratch/inaccessible"
touch "$scratch/not-directory"
chmod 000 "$scratch/inaccessible"
for execution_dir in "$scratch/missing" "$scratch/not-directory" "$scratch/inaccessible"; do
	# A root/elevated runner that can enter the fixture must fail this test, never claim a refusal.
	check 'invalid cwd fixture really refuses entry' /bin/bash -c 'if cd "$1" 2>/dev/null; then exit 1; fi' _ "$execution_dir"
	for policy in require-hippo-boundary block-env-file-access remind-rules-propagation format-lint-markdown; do
		rm -f -- "$fixture/delegate.effect" "$fixture/hippo.args"
		run_bridge "$policy" "$(jq -nc --arg cwd "$execution_dir" '{tool_name:"shell_command",tool_input:{command:"printf",args:["safe"],file_path:"README.md",cwd:$cwd}}')" refusal
		check "$policy refuses cwd before effects" test "$code" -ne 0
		check 'refused cwd has no policy or admission effect' test ! -e "$fixture/delegate.effect"
		check 'refused cwd has no admission effect' test ! -e "$fixture/hippo.args"
	done
done
run_bridge remind-rules-propagation "$(jq -nc --arg cwd "$fixture/working directory" '{tool_name:"shell_command",tool_input:{command:"printf",args:["safe"],directory:$cwd}}')"
check 'valid requested directory is the delegate cwd' test "$(cat "$fixture/delegate.effect")" = "$fixture/working directory"
rm -- "$fixture/delegate.effect"
run_bridge require-hippo-boundary 'not json' refusal
check 'malformed payload refuses without a delegate effect' test "$code" -ne 0
check 'malformed payload has no delegate effect' test ! -e "$fixture/delegate.effect"
run_bridge '../outside' '{}' refusal
check 'unlisted delegate name refuses' test "$code" -eq 2
# Parse and execute the actual repository registrations, using only fake capture and private Git metadata.
cp "$repo/.commandcode/settings.json" "$fixture/.commandcode/"
cp "$repo/.claude/hooks/ferret-capture.sh" "$fixture/.claude/hooks/"
cat >"$fixture/fake-ferret" <<'CAPTURE'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$@" >"$CAPTURE_ROOT/arguments"
cat >"$CAPTURE_ROOT/payload"
CAPTURE
chmod +x "$fixture/fake-ferret"
printf ' {"tool_name":"write_file","content":"synthetic raw payload"}\n\n' >"$scratch/raw"
check 'exactly three capture registrations are present' jq -e \
	'[.hooks[][]?.hooks[]?.command | select(contains("ferret-capture.sh"))] | length == 3' "$fixture/.commandcode/settings.json"
for entry in 'SessionStart session.started' 'PreToolUse tool.started' 'PostToolUse tool.completed'; do
	read -r native event <<<"$entry"
	command=$(jq -er --arg native "$native" --arg event "$event" \
		'[.hooks[$native][]?.hooks[]?.command | select(endswith("commandcode " + $event))] | if length == 1 then .[0] else error("missing or duplicate registration") end' "$fixture/.commandcode/settings.json")
	expected='bash "$(git rev-parse --show-toplevel)/.claude/hooks/ferret-capture.sh" commandcode '
	check 'capture registration targets only the shared repository wrapper' test "$command" = "$expected$event"
	# A failed source assertion must never execute a different registration.
	[[ $command == "$expected$event" ]] || continue
	(cd "$fixture" && "${fixture_environment[@]}" CAPTURE_ROOT="$scratch" \
		FERRET_BIN="$fixture/fake-ferret" /bin/bash -c "$command" <"$scratch/raw")
	check 'capture receives original input bytes' cmp "$scratch/raw" "$scratch/payload"
	check 'capture receives normalized static harness and event arguments' jq -e -Rn --arg event "$event" \
		'[inputs] == ["capture-hook","--harness","commandcode","--event",$event]' <"$scratch/arguments"
done
check 'HIPPO and environment native hooks fail closed' jq -e \
	'[.hooks.PreToolUse[]?.hooks[]? | select(.command | test("run-policy-hook.sh.*(require-hippo-boundary|block-env-file-access)$"))] as $h | ($h | length) == 3 and all($h[]; .failClosed == true)' "$fixture/.commandcode/settings.json"
printf 'Native public policy transport: %s passed, %s failed\n' "$pass" "$fail"
[[ $fail == 0 ]]
