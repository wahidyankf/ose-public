#!/usr/bin/env bash
# PreToolUse guard: resource-aware-development — refuse a compute-bearing Bash command that does
# not pass through an outer HIPPO boundary. Arms the existing rule in
# `repo-governance/development/practice/resource-aware-development/guarded-admission-and-parallelism.md`
# ("Run each independent compute-bearing DAG node through one outer HIPPO boundary"), which was
# previously prose-only and therefore silently bypassable.
#
# Why a guard and not a reminder: an unadmitted node is invisible to HIPPO, so HIPPO cannot defer
# or shed it. The host reaches critical pressure with the scheduler still reporting `normal`,
# because the scheduler was never told the work exists. The failure is therefore not recoverable
# after the fact by anything on the HIPPO side — it has to be refused before the process spawns.
#
# Scope note: this decides only WHETHER a boundary is present, never WHICH class is correct. Class
# choice stays unenforced by decision (it requires intent) per
# `resource-aware-development/enforcement-and-judgment-boundaries.md`; this guard does not touch
# that boundary.
#
# Placement: one byte-identical file is deployed at two levels — inside each consuming repository,
# and again at the machine level under the user's harness configuration. The two layers do different
# jobs. The repository copy is the durable, reviewable source of truth: version-controlled,
# travelling to other machines and to contributors, keeping the rule and its enforcement together.
# The machine-level copy covers what repository copies structurally cannot — a repository that does
# not carry one yet, a fresh clone, a scratch directory.
#
# Neither layer is redundant. A machine-level-only placement is fragile in a way already observed in
# practice: a user-level `settings.json` maintained as a symlink to a version-controlled source was
# silently replaced with a regular file by the harness the next time it wrote a setting, after which
# the version-controlled copy was no longer live and nothing detected the drift. A
# repository-only placement protects only the repositories that happen to carry a copy.
#
# The file stays byte-identical across both layers on purpose. Two variants of one guard is how
# drift hides: a hardening fix lands in whichever copy was being edited and is never ported, while
# both copies still appear to work. So it names the union of every local ecosystem (npm/npx/nx,
# dotnet, cargo, mix) and lets the inapplicable arms sit inert, which keeps parity checkable by
# checksum instead of by reading several divergent copies.
set -euo pipefail

input="$(cat)"
tool_name="$(printf '%s' "$input" | jq -r '.tool_name // empty')"
[ "$tool_name" != "Bash" ] && exit 0

cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty')"
[ -z "$cmd" ] && exit 0

# --- Consumer check ---------------------------------------------------------------------------
# Only a repository shipping the pinned `./hippo` consumer can satisfy this guard. Anywhere else the
# correction would name a tool that is not present, and a rule nobody can comply with is a rule that
# gets switched off — after which it protects nothing anywhere. So coverage deliberately follows the
# consumer rather than the filesystem.
#
# This check is what lets the same file serve both layers. Inside a consuming repository it passes
# trivially, so the repository copies need no variant of their own; in the machine-wide copy it is
# the whole reason a scratch directory or a non-consuming repository is left alone.
repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[ -n "$repo_root" ] && [ -x "$repo_root/hippo" ] || exit 0

deny() {
	# `permissionDecisionReason` is the only text the model reliably sees, so it carries the
	# correction inline rather than pointing at a document the model then has to go read.
	local what="$1"
	cat <<JSON
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Repo policy (resource-aware-development): $what must run inside one outer HIPPO boundary. Re-run it as: rtk ./hippo run --class <ephemeral|service|transactional> --disk-path . -- <command>. Pick ephemeral for short isolated work, service for anything that leaves a server or container running, transactional for builds/gates that must not interleave. Do NOT wrap 'npm run <script>' — those scripts already carry their own guard, and double-guarding stalls the run at near-zero CPU while hippo status still reports normal. Prefer sequential per-project runs over a run-many fan-out: each target is itself a nested chain, so one fan-out expands into dozens of concurrent processes."}}
JSON
	exit 0
}

# The boundary may legitimately appear anywhere in the line, including behind `rtk` and after a
# `cd ... &&`. Its presence anywhere is treated as covering the line: the realistic failure this
# guard exists to stop is a line with NO boundary at all, and a stricter per-segment parse would
# reject ordinary composed commands that are already admitted.
if printf '%s' "$cmd" | grep -qE '(^|[^[:alnum:]_-])\.?/?hippo[[:space:]]+run([^[:alnum:]_.-]|$)'; then
	exit 0
fi

# --- Command-position matching ------------------------------------------------------------------
# A verb counts only when it is what the shell will actually execute, never when it is an argument
# or a quoted string. Matching a verb anywhere in the line looks stricter but is strictly worse: it
# refuses `grep -rn "npm install" docs/`, `rg "dotnet build"`, and every command whose text merely
# discusses a build. A guard that blocks ordinary searching is a guard that gets switched off, and a
# switched-off guard protects nothing anywhere — the same reasoning as the consumer check above.
#
# So the line is split at the points where a shell starts a new command — `|`, `&&`, `||`, `;`,
# newline, and subshell or substitution boundaries — and only the first word of each resulting
# segment is considered.
#
# Residual, stated rather than hidden: a verb handed to an interpreter as data (`sh -c "npm ci"`,
# `bash -lc ...`, a Makefile target, an alias) is not in command position here and passes. That is
# the same intermediary gap the enforcement disposition already records; text matching cannot close
# it in principle, and closing it by matching argument text would reintroduce the false positives
# above.
segments="$(printf '%s' "$cmd" | sed -E 's/\$\(/\n/g; s/[|;&()`]/\n/g')"

while IFS= read -r seg; do
	# Strip leading whitespace.
	seg="${seg#"${seg%%[![:space:]]*}"}"
	[ -z "$seg" ] && continue

	# Strip prefixes that wrap a command without being one: environment assignments and the
	# pass-through launchers. `rtk` matters most here — every command in these repositories is
	# typed through it, so without this the first word is always `rtk` and nothing ever matches.
	while [[ "$seg" =~ ^([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*|rtk|sudo|time|env|nice|command|exec|builtin)[[:space:]]+ ]]; do
		seg="${seg#"${BASH_REMATCH[0]}"}"
		seg="${seg#"${seg%%[![:space:]]*}"}"
	done
	[ -z "$seg" ] && continue

	first_raw="${seg%%[[:space:]]*}"
	first="${first_raw##*/}" # a PATH-qualified call is the same program
	rest="${seg#"$first_raw"}"
	rest="${rest#"${rest%%[![:space:]]*}"}"
	second="${rest%%[[:space:]]*}"

	# Trivial-invocation carve-out, per segment. A metadata query spawns no build graph, no
	# server and no test host. `-v` is excluded deliberately: it means verbosity, not version,
	# in most of these tools.
	case "$second" in
	--version | --help | -h | -V) continue ;;
	esac
	# ...and the same for `<tool> <subcommand> --help`, but only when the flag is the last word,
	# so `nx run app:build --help-ish-arg extra` is still a real invocation.
	third="${rest#"$second"}"
	third="${third#"${third%%[![:space:]]*}"}"
	case "$third" in
	--version | --help | -h | -V) continue ;;
	esac

	case "$first" in
	npm)
		# Named explicitly by the rule: "npm install and npm exec are not scripts and do
		# take the outer boundary".
		#
		# `npm run <script>` is deliberately absent: every compute-bearing package.json
		# script in these repositories already invokes ./hippo run itself or delegates to
		# one that does, so an outer boundary makes the inner call wait on its own
		# ancestor's lease. The run then stalls at near-zero CPU while `hippo status` still
		# reports `normal` — a failure that reads as a hang, not as a policy error, which is
		# why this carve-out is load-bearing rather than a convenience.
		case "$second" in
		exec | install | ci) deny "'npm $second'" ;;
		esac
		;;
	npx)
		# npm exec under another name; takes the boundary identically.
		deny "'npx'"
		;;
	nx)
		# A bare `nx` through a PATH shim expands into the same task graph as `npm exec nx`,
		# so it takes the boundary on its own name.
		case "$second" in
		run | run-many | affected | build | test | lint | watch | release | e2e) deny "'nx $second'" ;;
		esac
		;;
	dotnet)
		# Only verbs that spawn a build graph, a test host, or a long-lived process. Metadata
		# verbs (--list-sdks, --info, nuget locals --list) spawn none. This arm also covers
		# the residue case: build/test/publish leave MSBuild node-reuse workers and Roslyn
		# VBCSCompiler servers resident after the command returns, so an unadmitted run
		# dirties the host for every admission that follows it.
		case "$second" in
		build | publish | test | run | restore | format | watch | msbuild | pack) deny "'dotnet $second'" ;;
		esac
		;;
	cargo)
		# `xtask` is included because it is the entry point rhino actually uses; it delegates
		# to a full workspace build. `metadata` and `tree` spawn nothing and are absent.
		case "$second" in
		build | test | run | check | clippy | bench | doc | install | xtask | fmt | nextest) deny "'cargo $second'" ;;
		esac
		;;
	mix)
		# `phx.server` and `run --no-halt` leave a server resident, which is why the service
		# class exists; the rest spawn a compile graph or a test host.
		case "$second" in
		deps.get | deps.compile | compile | test | run | release | phx.server | dialyzer | credo | format) deny "'mix $second'" ;;
		ecto.*) deny "'mix $second'" ;;
		esac
		;;
	esac
done <<<"$segments"

exit 0
