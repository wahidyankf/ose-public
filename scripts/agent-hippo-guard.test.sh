#!/usr/bin/env bash
# Tests for require-hippo-boundary.sh. The guard always exits 0; what varies is whether a `deny`
# payload is emitted. Both directions are asserted — a guard verified only on its denying cases
# would pass while denying everything, which in a PreToolUse hook means the session cannot run any
# command at all.
#
# The firing assertion checks the payload SHAPE, not merely that output exists. PreToolUse discards
# plain-text stdout to the debug log, so a guard printing prose is silently inert while still
# looking "non-empty" to a length check — the exact way a hook can pass its own suite and still let
# the host run out of memory.
set -uo pipefail
git_local_env_vars=$(git rev-parse --local-env-vars) || exit 1
while IFS= read -r git_local_env_var; do
	unset "$git_local_env_var"
done <<<"$git_local_env_vars"

# Absolute, because the consumer cases below run from another directory: a relative path would
# miss the hook there, and the resulting silence would pass as a correct allow.
HOOK="$(cd "$(dirname "$0")" && pwd)/agent-hippo-guard.sh"
pass=0
fail=0

bash_payload() { jq -nc --arg c "$1" '{tool_name:"Bash",tool_input:{command:$c}}'; }

expect() {
	local label="$1" payload="$2" want="$3" out code
	out="$(printf '%s' "$payload" | "$HOOK" 2>/dev/null)"
	code=$?
	if [ "$code" -ne 0 ]; then
		echo "FAIL: $label — exited $code, guard must always exit 0"
		fail=$((fail + 1))
		return
	fi
	if [ "$want" = "denies" ]; then
		if ! printf '%s' "$out" | jq -e '
			.hookSpecificOutput.hookEventName == "PreToolUse"
			and .hookSpecificOutput.permissionDecision == "deny"
			and (.hookSpecificOutput.permissionDecisionReason | type == "string" and length > 80)
		' >/dev/null 2>&1; then
			echo "FAIL: $label — expected a deny payload, got: ${out:-<empty>}"
			fail=$((fail + 1))
			return
		fi
	fi
	if [ "$want" = "allows" ] && [ -n "$out" ]; then
		echo "FAIL: $label — expected silence, got: $out"
		fail=$((fail + 1))
		return
	fi
	pass=$((pass + 1))
}

cmd_denies() { expect "$1" "$(bash_payload "$2")" denies; }
cmd_allows() { expect "$1" "$(bash_payload "$2")" allows; }

# --- Non-Bash and malformed input: never decide -----------------------------------------------
expect "Edit tool is not matched" '{"tool_name":"Edit","tool_input":{"file_path":"AGENTS.md"}}' allows
expect "Read tool is not matched" '{"tool_name":"Read","tool_input":{"file_path":"package.json"}}' allows
expect "missing command" '{"tool_name":"Bash","tool_input":{}}' allows
expect "empty payload" '{}' allows
cmd_allows "empty command string" ""

# --- The boundary itself, in each form it legitimately appears in ------------------------------
cmd_allows "canonical guarded form" "rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm install"
cmd_allows "guarded without rtk" "./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- run app:build"
cmd_allows "guarded after a cd" "cd apps/ose-id-be && ../../hippo run --class ephemeral --resource-tier heavy --disk-path . -- dotnet build"
cmd_allows "guarded fan-out" "rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- affected -t build"
cmd_allows "hippo on PATH" "hippo run --class ephemeral --resource-tier standard --disk-path . -- cargo test"
cmd_allows "hippo status is not compute" "rtk ./hippo status"

# --- The carve-out that must NOT be wrapped ----------------------------------------------------
# Every compute-bearing package.json script already carries its own boundary. Denying these would
# push the model into double-guarding, where the inner call waits on its own ancestor's lease.
cmd_allows "npm run script" "rtk npm run build"
cmd_allows "npm run with args" "rtk npm run test -- --watch=false"
cmd_allows "npm test alias" "rtk npm test"

# --- Ordinary non-compute commands -------------------------------------------------------------
cmd_allows "git status" "rtk git status"
cmd_allows "reading a file" "rtk cat package.json"
cmd_allows "listing" "rtk ls apps/"

# --- Trivial metadata invocations ---------------------------------------------------------------
cmd_allows "tool version" "rtk dotnet --version"
cmd_allows "npx tool version" "rtk npx playwright --version"
cmd_allows "cargo version" "cargo --version"
cmd_allows "npm help" "npm --help"
cmd_allows "tool subcommand help" "rtk nx run --help"
cmd_allows "dotnet metadata verb" "rtk dotnet --list-sdks"
cmd_allows "cargo metadata is not compute" "rtk cargo metadata --format-version 1"
cmd_allows "mix help is not compute" "rtk mix --help"

# --- npm exec / install / ci ---------------------------------------------------------------------
cmd_denies "unguarded npm install" "rtk npm install"
cmd_denies "unguarded npm ci" "npm ci"
cmd_denies "unguarded npm exec" "rtk npm exec nx -- run ose-id-be:test:quick"
cmd_denies "the exact fan-out that exhausted the host" "rtk npm exec nx -- run-many -t typecheck,lint,test:quick -p ose-id-be,ose-id-web"

# --- npx -------------------------------------------------------------------------------------------
cmd_denies "unguarded npx" "rtk npx nx run ose-id-web:build"
cmd_denies "unguarded npx playwright" "npx playwright test"

# --- prettier and markdownlint-cli2 without HIPPO admission ------------------------------------------
# Only these two tools, and only through a spelling that refuses to install a missing tool. Verified
# with npm 11: `npx --no-install` and `npm exec --no` cancel the fetch, but `npm exec --no-install` only
# warns and still installs, so it does not qualify. File arguments are never inspected.
cmd_allows "npx no-install prettier check" "npx --no-install prettier --check x.md"
cmd_allows "rtk npx no-install markdownlint-cli2" "rtk npx --no-install markdownlint-cli2 '**/*.md'"
cmd_allows "npm exec no separator markdownlint-cli2" 'npm exec --no -- markdownlint-cli2 "**/*.md"'
cmd_allows "npm exec no-flag prettier without separator" "npm exec --no prettier -- --help"
cmd_allows "rtk npm exec no-flag prettier with separator" "rtk npm exec --no -- prettier --check ."
cmd_allows "env assignment before an admitted tool" "CI=1 npx --no-install prettier --check ."
cmd_allows "path-qualified npx before an admitted tool" "/usr/bin/npx --no-install prettier --check ."
cmd_allows "admitted prettier with an output redirect" "npx --no-install prettier --check . >/tmp/prettier.log"
# `npx --no` exits 0 without running the tool when the tool is missing, so it is not an accepted spelling.
cmd_denies "npx --no prettier write" "npx --no prettier --write ."
cmd_denies "rtk npx --no markdownlint-cli2" "rtk npx --no markdownlint-cli2 '**/*.md'"
cmd_denies "npx prettier without a no-install flag" "npx prettier --check x.md"
cmd_denies "npm exec prettier without a no-install flag" "npm exec -- prettier --check ."
cmd_denies "npm exec no-install spelling still installs" "npm exec --no-install -- prettier --check ."
cmd_denies "npx no-install other tool" "npx --no-install eslint ."
cmd_denies "npx no-install markdownlint without cli2" "npx --no-install markdownlint --check ."
cmd_denies "npx no-install versioned prettier" "npx --no-install prettier@3 --check ."
cmd_denies "npx no-install tool by path" "npx --no-install ./node_modules/.bin/prettier --check ."
cmd_denies "npx no-install separator is not accepted" "npx --no-install -- prettier --check ."
cmd_denies "npx no-install with no tool" "npx --no-install"
cmd_denies "bare npx" "npx"
cmd_denies "npm exec no-flag other tool" "npm exec --no -- some-other-tool"
cmd_denies "npx no-install extra flag before the tool" "npx --no-install --package=evil prettier --check ."
cmd_denies "npm exec no-flag extra flag before the tool" 'npm exec --no --call="npm ci" -- prettier'
cmd_denies "allowed prettier chained with unguarded npx" "npx --no-install prettier --check . && npx eslint ."
cmd_denies "allowed prettier chained with unguarded npm exec" "npm exec --no -- prettier --check . ; npm exec nx -- run app:build"
cmd_denies "allowed prettier then unguarded npm ci by or" "npx --no-install prettier --check . || npm ci"
cmd_denies "allowed prettier piped to unguarded exec" "npx --no-install prettier --check . | npm exec nx -- run app:build"
cmd_denies "allowed prettier with an unguarded substitution" "npx --no-install prettier --check . \$(npm ci)"
cmd_denies "allowed prettier with an unguarded backtick" "npx --no-install prettier --check . \`npm ci\`"
cmd_denies "allowed prettier then unguarded command on a new line" "npx --no-install prettier --check .
npm ci"
# Direct calls were never guarded, and stay unaffected by the no-install exemption.
cmd_allows "direct prettier is not guarded" "prettier --check ."
cmd_allows "direct markdownlint-cli2 is not guarded" 'markdownlint-cli2 "**/*.md"'
cmd_allows "node_modules prettier is not guarded" "./node_modules/.bin/prettier --check ."

# --- bare nx through a PATH shim -------------------------------------------------------------------
cmd_denies "bare nx run" "rtk nx run ose-id-web:build"
cmd_denies "bare nx affected" "nx affected -t test:quick"
cmd_allows "nx substring is not nx" "rtk ls linux-nxdomain"

# --- dotnet ----------------------------------------------------------------------------------------
cmd_denies "unguarded dotnet build" "rtk dotnet build apps/ose-id-be/src/OseId.Host/OseId.Host.csproj"
cmd_denies "unguarded dotnet test" "dotnet test"
cmd_denies "unguarded dotnet publish" "rtk dotnet publish -c Release"
cmd_denies "unguarded dotnet format" "rtk dotnet format --verify-no-changes"

# --- cargo -----------------------------------------------------------------------------------------
cmd_denies "unguarded cargo test" "rtk cargo test --workspace"
cmd_denies "unguarded cargo xtask" "cargo xtask ci"
cmd_denies "unguarded cargo clippy" "rtk cargo clippy --all-targets"

# --- mix -------------------------------------------------------------------------------------------
cmd_denies "unguarded mix deps.get" "rtk mix deps.get"
cmd_denies "unguarded mix test" "mix test"
cmd_denies "unguarded mix phx.server" "rtk mix phx.server"

# --- Command position: a verb is only a verb when the shell would execute it ------------------------
# REGRESSION, observed live during authoring: the guard once matched these verbs anywhere in the
# line, so an ordinary search for the string was refused — including the command that was running
# this very suite. A guard that blocks everyday searching is one that gets switched off, and a
# switched-off guard protects nothing at all.
cmd_allows "grep for a guarded verb" "rtk grep -rn 'npm install' docs/"
cmd_allows "ripgrep for a guarded verb" "rg 'dotnet build' --glob '*.md'"
cmd_allows "grep piped to head" "rtk grep -rn 'npm exec' . | head -30"
cmd_allows "prose in an echo" "echo 'run npm install first'"
cmd_allows "prose in an echo with a pipe" "echo 'run npm install first' | tee /tmp/note"
cmd_allows "a filename containing a verb" "rtk cat docs/npm-install-notes.md"
cmd_allows "a flag value containing a verb" "rtk git log --grep 'cargo build' --oneline"

# The flip side: command position still catches every real invocation, including composed ones.
cmd_denies "verb after cd and &&" "cd apps/ose-id-web && npm install"
cmd_denies "verb after a semicolon" "rtk git status; npm ci"
cmd_denies "verb as the second stage of a pipe" "rtk echo hi | npm exec nx -- run app:build"
cmd_denies "verb behind an env assignment" "CI=1 npm install"
cmd_denies "verb behind rtk and an env assignment" "rtk NODE_ENV=test npm exec nx -- run app:test"
cmd_denies "PATH-qualified invocation" "/usr/local/bin/npm install"
cmd_denies "verb inside a subshell" "(cd apps/x && dotnet build)"
cmd_denies "verb inside a command substitution" "echo \$(npm exec nx -- show projects)"

# --- REGRESSION: the trailing-flag hole --------------------------------------------------------------
# An earlier draft allowed any command ending in a help-shaped token, so a real build ending in one
# was waved through. The carve-out is now positional: only the token right after the tool, or right
# after its subcommand, qualifies.
cmd_denies "build with a trailing help-shaped arg" "rtk npm exec nx -- run app:build --help"
cmd_denies "dotnet test with trailing -v" "rtk dotnet test -v"
cmd_denies "subcommand help flag that is not last" "rtk nx run app:build --help extra"
cmd_allows "verb plus a bare help flag prints help only" "cargo test -h"
cmd_denies "verb plus an argument and a help flag" "cargo test --workspace -h"

# --- REGRESSION: the verb's trailing boundary ---------------------------------------------------------
# Once `([[:space:]]|$)`, so any non-space character immediately after the verb — a semicolon, a
# redirect, an ampersand — ended the match and let the command through.
cmd_denies "trailing semicolon" "rtk npm install; echo done"
cmd_denies "trailing redirect" "rtk dotnet build >/tmp/out.log"
cmd_denies "trailing ampersand backgrounding" "npx playwright test &"

# --- REGRESSION: composition must not launder an unguarded node ----------------------------------------
# A guarded segment covers the line by design, but a line with NO boundary anywhere must be denied
# however it is composed.
cmd_denies "unguarded command chained after a read" "rtk git status && npm exec nx -- run app:build"
cmd_denies "unguarded command in a semicolon chain" "cd apps/ose-id-web; npx next build"

# --- Consumer check: coverage follows the ./hippo consumer, not the filesystem --------------------------
# These run the guard from a directory that is not a HIPPO-consuming repository. The command is one
# the guard denies everywhere else, so a silent result here proves the check fired rather than that
# the pattern simply missed.
consumer_case() {
	local label="$1" dir="$2" out
	out="$(cd "$dir" && printf '%s' "$(bash_payload "rtk npm install")" | "$HOOK" 2>/dev/null)"
	if [ -n "$out" ]; then
		echo "FAIL: $label — expected silence outside a consuming repo, got a deny"
		fail=$((fail + 1))
		return
	fi
	pass=$((pass + 1))
}

scratch="$(mktemp -d)"
scratch=$(cd "$scratch" && pwd -P) || exit 1
trap 'rm -rf "$scratch"' EXIT
consumer_case "outside any git repository" "$scratch"

[[ -d $scratch && ! -e $scratch/.git ]] || exit 1
mkdir "$scratch/git-template" || exit 1
GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null GIT_CONFIG_NOSYSTEM=1 \
	GIT_CEILING_DIRECTORIES="$scratch" GIT_TEMPLATE_DIR="$scratch/git-template" \
	git --git-dir="$scratch/.git" --work-tree="$scratch" -C "$scratch" init -q 2>/dev/null || exit 1
fixture_root=$(GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null \
	GIT_CEILING_DIRECTORIES="$scratch" git --git-dir="$scratch/.git" -C "$scratch" rev-parse --show-toplevel) || exit 1
[[ $fixture_root == "$scratch" ]] || exit 1
consumer_case "git repository with no ./hippo consumer" "$scratch"

# HIPPO's own source checkout: an executable `./hippo` bootstrap with no `hippo.lock`. HIPPO cannot
# guard HIPPO, so its documented direct setup must pass.
printf '#!/bin/sh\n' >"$scratch/hippo"
chmod +x "$scratch/hippo"
consumer_case "HIPPO source checkout with no hippo.lock" "$scratch"

# The same tree with the lock is a consumer again, which proves the lock is the deciding difference.
: >"$scratch/hippo.lock"
out="$(cd "$scratch" && printf '%s' "$(bash_payload "rtk npm install")" | "$HOOK" 2>/dev/null)"
if printf '%s' "$out" | jq -e '.hookSpecificOutput.permissionDecision == "deny"' >/dev/null 2>&1; then
	pass=$((pass + 1))
else
	echo "FAIL: locked ./hippo consumer — expected a deny, got: ${out:-<empty>}"
	fail=$((fail + 1))
fi

# Positive control: the same command inside a repository that DOES ship ./hippo must still be
# denied. Without this, the consumer cases above would pass against a guard that never fires at all.
cmd_denies "consuming repository still denies" "rtk npm install"

# --- Launchers judged by the program they run: xargs and find -exec ----------------------------------
# REGRESSION (known gap A): an exempt tool piped into xargs made the guarded program invisible to the
# first-word check. A launcher is now judged by the program it runs, and any other program is refused.
cmd_denies "xargs npm ci after a no-install prettier pipe (gap A)" "npx --no-install prettier --check . | xargs npm ci"
cmd_denies "xargs npm ci" "xargs npm ci"
cmd_denies "xargs npm exec nx" "git ls-files | xargs npm exec nx -- run app:build"
cmd_denies "xargs npm with the verb supplied by stdin" "echo ci | xargs npm"
cmd_denies "xargs replace-string program" "echo ci | xargs -I{} npm {} ci"
cmd_denies "xargs -i replace option" "echo ci | xargs -i npm ci"
cmd_denies "xargs long replace option" "echo ci | xargs --replace=X npm ci"
cmd_denies "xargs unknown option may hide the program" "xargs --bogus npm ci"
cmd_denies "xargs with a numeric value before the program" "xargs -n 1 npm ci"
cmd_denies "xargs runs sh" "xargs sh -c 'npm ci'"
cmd_denies "xargs runs a non-exempt tool by decision" "git status | xargs rm"
cmd_denies "xargs runs grep, refused by decision" "git ls-files | xargs grep -l foo"
cmd_denies "xargs quoted program name" 'xargs "npm" ci'
cmd_denies "xargs exempt tool by path" "xargs /usr/bin/prettier --check"
cmd_denies "xargs npx without a no-install flag" "xargs npx prettier --check"
cmd_denies "xargs npx with the no-install flag refused" "xargs npx --no prettier --check"
cmd_denies "xargs npx tool supplied only by stdin" "echo prettier | xargs npx --no-install"
cmd_denies "xargs npm exec tool supplied only by stdin" "echo prettier | xargs npm exec --no --"
cmd_denies "xargs npm exec with a non-exempt tool" "git ls-files | xargs npm exec --no -- eslint"
cmd_denies "xargs running find with an exec" "xargs find . -exec npm ci {} ;"
cmd_denies "xargs behind rtk" "rtk xargs npm ci"
cmd_denies "xargs by path" "/usr/bin/xargs npm ci"
cmd_denies "xargs after a conjunction" "true && xargs npm ci"
cmd_denies "xargs inside a command substitution" "echo \$(xargs npm ci)"
cmd_denies "xargs running env" "git ls-files -z | xargs -0 -n1 env npm ci"
cmd_denies "find -exec a guarded tool" "find . -name x -exec npm ci \\;"
cmd_denies "find -exec with a plus terminator" "find . -name '*.md' -exec npm ci {} +"
cmd_denies "find -execdir a guarded tool" "find . -execdir npm ci {} \\;"
cmd_denies "find -ok a guarded tool" "find . -ok npm ci \\;"
cmd_denies "find -okdir a guarded tool" "find . -okdir npm ci {} \\;"
cmd_denies "find -exec a shell" "find . -exec sh -c 'npm ci' \\;"
cmd_denies "find -exec with a placeholder program" "find . -exec {} \\;"
cmd_denies "find -exec with no command" "find . -exec \\;"
cmd_denies "find -exec inside an escaped group" "find . \\( -name x -exec npm ci \\; \\)"
cmd_denies "find -exec with a quoted keyword" 'find . "-exec" npm ci \;'
cmd_denies "find -exec npx without a no-install flag" "find . -exec npx prettier {} +"
cmd_denies "find -exec npx whose tool is a placeholder" "find . -exec npx --no-install {} \\;"
cmd_denies "find -exec npm exec with a non-exempt tool" "find . -exec npm exec --no -- eslint {} +"
cmd_denies "find -exec after an exempt one" "find . -exec prettier --check {} \\; -exec npm ci \\;"
cmd_denies "find running find with an exec" "xargs find . -exec npm ci \\;"
cmd_allows "xargs with no program runs echo" "git ls-files | xargs"
cmd_allows "xargs echo" "echo npm ci | xargs echo"
cmd_allows "xargs echo with harmless options" "git ls-files | xargs -r -0 echo"
cmd_allows "xargs --version" "xargs --version"
cmd_allows "xargs exempt prettier" "git ls-files '*.md' | xargs prettier --check"
cmd_allows "xargs exempt prettier with separate and attached values" "git ls-files -z | xargs -0 -n 1 -P 4 prettier --check"
cmd_allows "xargs exempt prettier with a separate delimiter value" "git ls-files | xargs -d , prettier --check"
cmd_allows "xargs no-install prettier" "xargs npx --no-install prettier --check"
cmd_allows "xargs npm exec no-install markdownlint-cli2" "git ls-files '*.md' | xargs npm exec --no -- markdownlint-cli2"
cmd_allows "find -exec exempt prettier" "find . -name '*.md' -exec prettier --check {} +"
cmd_allows "find -exec no-install markdownlint-cli2" "find . -name '*.md' -exec npx --no-install markdownlint-cli2 {} +"
cmd_allows "find -exec echo" "find . -exec echo {} \\;"
cmd_allows "find without an exec action is not a launcher" "find . -name '*.md' -print"
cmd_allows "grep text naming a launcher is prose" "grep -rn 'xargs npm ci' docs/"

# --- Shell keywords and PATH-qualified prefixes do not hide a command --------------------------------
cmd_denies "guarded command in a then branch" "if true; then npm ci; fi"
cmd_denies "guarded command in a while body" "while false; do npm ci; done"
cmd_denies "guarded command after a negation" "! npm ci"
cmd_denies "guarded command in a brace group" "{ npm ci; }"
cmd_denies "path-qualified env hides nothing" "/usr/bin/env npm ci"
cmd_denies "path-qualified nice hides nothing" "/usr/bin/nice npm ci"
cmd_allows "exempt tool in a then branch" "if true; then prettier --check .; fi"
cmd_allows "harmless command in a then branch" "if true; then echo ok; fi"

# --- A launcher with an option hides its program; the guard refuses rather than guesses ------------
cmd_denies "nice with an option" "nice -n 5 npm ci"
cmd_denies "env with an option" "env -i npm ci"
cmd_denies "sudo with an option" "sudo -u root npm ci"
cmd_denies "time with an option" "time -p npm ci"

# --- Quoting and escaping do not change the program the shell runs -------------------------------------
cmd_denies "quoted guarded program" '"npm" ci'
cmd_denies "quoted guarded verb" 'npm "ci"'
cmd_denies "quoted program behind rtk" 'rtk "npm" ci'
cmd_denies "backslash-escaped program" '\npm ci'
cmd_denies "quoted cargo program" '"cargo" test'

# --- The deny text tells the agent what to do, and no longer repeats the retired claim -----------------
stale_out="$(printf '%s' "$(bash_payload "npm ci")" | "$HOOK" 2>/dev/null)"
if printf '%s' "$stale_out" | jq -e '.hookSpecificOutput.permissionDecisionReason | (contains("already carry their own guard") | not) and contains("in a second boundary")' >/dev/null 2>&1; then
	pass=$((pass + 1))
else
	echo "FAIL: deny text still carries the retired claim or lacks the second-boundary correction: ${stale_out:-<empty>}"
	fail=$((fail + 1))
fi
launcher_out="$(printf '%s' "$(bash_payload "git ls-files | xargs npm ci")" | "$HOOK" 2>/dev/null)"
if printf '%s' "$launcher_out" | jq -e '.hookSpecificOutput.permissionDecisionReason | contains("xargs") and contains("Run the program itself inside the boundary")' >/dev/null 2>&1; then
	pass=$((pass + 1))
else
	echo "FAIL: launcher deny text does not tell the agent to run the program itself: ${launcher_out:-<empty>}"
	fail=$((fail + 1))
fi

echo "passed=$pass failed=$fail"
[ "$fail" -eq 0 ]
