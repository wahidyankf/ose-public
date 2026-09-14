#!/usr/bin/env bash
# ==============================================================================
# outbound-preflight.sh — the generic leaf wrapper every public gate calls
# ==============================================================================
# Usage:
#   outbound-preflight.sh --surface <surface> [--text <string>]... [--file <path>]...
#                         [--file-list <path>]... [--names-list <path>]... [--terms <path>]
#
#   --surface     baseline | diff | commit | ref | pull-request | release | logs
#   --text        an outbound string: a commit message, a branch name, a PR body
#   --file        a file whose contents are outbound
#   --file-list   a NUL-delimited list of files whose contents are outbound; each
#                 entry is an input named exactly as listed
#   --names-list  a NUL-delimited list of outbound names, screened as one text
#                 input holding one name per line
#   --terms       term set to screen against (default: shape-terms.txt beside this)
#
# The two lists let a caller hand over a whole tracked tree without one argument
# per path, which would overflow the host's argument limit on a large tree.
#
# Exit codes are the whole interface:
#
#   0  clean       nothing prohibited was found; publication may proceed
#   1  blocked     something prohibited was found; publication must not proceed
#   2  scan error  the scan could not be trusted; publication must not proceed
#
# There is no allowlist, suppression, or bypass. 1 and 2 are both refusals; they
# differ only in whether we know what is wrong. A scan that cannot run is not a
# scan that passed.
#
# Nothing this script prints ever contains a matched value, a term from the term
# set, or raw scanner output. Diagnostics carry a detector, a screened path, a
# line number, and a status — that is the entire vocabulary.
#
# This repository is public, so its tracked term set holds shapes only: an
# absolute home path, a private address range, an internal hostname suffix. A
# workspace that must screen for named private identifiers keeps that list
# outside every public checkout and passes it with --terms.
# ==============================================================================

# No `-e`. This script's whole interface is its exit code, and it depends on
# commands that return non-zero as part of normal operation: `grep -q` finding
# nothing, and TruffleHog returning 183 when it finds something. Under `-e` the
# first of those would abort the script with status 1 — which this script's own
# contract reads as "blocked" — turning a clean scan into a false refusal.
# Every fallible command is checked explicitly instead.
set -uo pipefail

readonly TRUFFLEHOG_VERSION="3.97.1"

# Digests are the GitHub release-asset API `digest` values for v3.97.1. No other
# source is approved, and a mismatch is a scan error rather than a warning.
trufflehog_digest() {
	case "$1" in
	darwin_amd64) echo "1515710bb16be5653ca9986c27ecd1a0e7536fc6e53ad46f7100992692f6a05f" ;;
	darwin_arm64) echo "1af86cf30c1cc5c1735ec6af9292b399ec9bed3ff1b30be13fcbfd4a30ab449a" ;;
	linux_amd64) echo "f863ea3a8d786f7d097870496c977944cce7372a2fe1e56707d965016e543ece" ;;
	linux_arm64) echo "57bfcc0988aae3f2ef97e74abe1138cf37a8fbd84dd26299062c77a6a6b125dd" ;;
	*) return 1 ;;
	esac
}

readonly SURFACES=" baseline diff commit ref pull-request release logs "
readonly TERM_CLASSES=" maintainer-path internal-address internal-hostname "
readonly TERM_KINDS=" literal regex "

here=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)

surface=""
terms_file="$here/shape-terms.txt"
declare -a input_labels=()
declare -a input_files=()

# ------------------------------------------------------------------------------
# Output. Two channels, both sanitized by construction.
# ------------------------------------------------------------------------------

emit_finding() {
	# emit_finding <detector> <screened-path> <line>
	#
	# Findings land in a file rather than a counter. Some producers run inside a
	# command substitution, and a subshell's increment would be lost on return.
	printf '[public-safety] finding %s %s:%s\n' "$1" "$2" "$3" >>"$FINDINGS_FILE"
}

scan_error() {
	# A scan error blocks. It names what could not be trusted, never the value.
	printf '[public-safety] blocked scan-error %s\n' "$*" >&2
	exit 2
}

# ------------------------------------------------------------------------------
# Workspace. Outside the repository, removed on every exit path.
# ------------------------------------------------------------------------------

WORK=$(mktemp -d "${TMPDIR:-/tmp}/public-safety.XXXXXX") || scan_error "cannot create a working directory"
cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT INT TERM

FINDINGS_FILE="$WORK/findings.txt"
: >"$FINDINGS_FILE"

# ------------------------------------------------------------------------------
# Arguments
# ------------------------------------------------------------------------------

text_count=0
names_count=0
while [[ $# -gt 0 ]]; do
	case "$1" in
	--surface)
		[[ $# -ge 2 ]] || scan_error "--surface needs a value"
		surface="$2"
		shift 2
		;;
	--terms)
		[[ $# -ge 2 ]] || scan_error "--terms needs a value"
		terms_file="$2"
		shift 2
		;;
	--text)
		[[ $# -ge 2 ]] || scan_error "--text needs a value"
		text_count=$((text_count + 1))
		printf '%s\n' "$2" >"$WORK/text-$text_count"
		printf '%s' "<${surface:-input}-text-$text_count>" >"$WORK/text-$text_count.label"
		input_labels+=("<${surface:-input}-text-$text_count>")
		input_files+=("$WORK/text-$text_count")
		shift 2
		;;
	--file)
		[[ $# -ge 2 ]] || scan_error "--file needs a value"
		[[ -r "$2" ]] || scan_error "input file is not readable"
		input_labels+=("$2")
		input_files+=("$2")
		shift 2
		;;
	--file-list)
		[[ $# -ge 2 ]] || scan_error "--file-list needs a value"
		[[ -r "$2" ]] || scan_error "input list is not readable"
		while IFS= read -r -d '' entry || [[ -n "${entry:-}" ]]; do
			[[ -z "$entry" ]] && continue
			[[ -r "$entry" ]] || scan_error "input file is not readable"
			input_labels+=("$entry")
			input_files+=("$entry")
		done <"$2"
		shift 2
		;;
	--names-list)
		[[ $# -ge 2 ]] || scan_error "--names-list needs a value"
		[[ -r "$2" ]] || scan_error "names list is not readable"
		names_count=$((names_count + 1))
		tr '\0' '\n' <"$2" >"$WORK/names-$names_count" || scan_error "cannot stage the names list"
		if [[ -s "$WORK/names-$names_count" ]]; then
			printf '%s' "<${surface:-input}-names-$names_count>" >"$WORK/names-$names_count.label"
			input_labels+=("<${surface:-input}-names-$names_count>")
			input_files+=("$WORK/names-$names_count")
		fi
		shift 2
		;;
	*) scan_error "unrecognized argument" ;;
	esac
done

[[ -n "$surface" ]] || scan_error "--surface is required"
[[ "$SURFACES" == *" $surface "* ]] || scan_error "unsupported surface"
[[ ${#input_files[@]} -gt 0 ]] || scan_error "no outbound input was given"

# A term set carrying a credential would publish it to anyone who reads the
# file, so a credential-shaped term is malformed rather than merely unwise.
reject_credential_shaped_term() {
	local value=$1 lineno=$2

	if printf '%s' "$value" |
		grep -qE '(ghp_|gho_|ghu_|ghs_|ghr_|github_pat_|xox[baprs]-|AKIA|ASIA|AIza|glpat-|dop_v1_|-----BEGIN)'; then
		scan_error "malformed term set at line $lineno: value carries a known credential prefix"
	fi
	if printf '%s' "$value" | grep -qiE '\b(pass(word)?|secret|token|api[_-]?key|private[_-]?key|credential)[[:space:]]*[:=]'; then
		scan_error "malformed term set at line $lineno: value looks like a credential assignment"
	fi
	if printf '%s' "$value" | grep -qE '^[a-zA-Z][a-zA-Z0-9+.-]*://[^[:space:]/@]+:[^[:space:]/@]+@'; then
		scan_error "malformed term set at line $lineno: value looks like a connection string"
	fi
	if printf '%s' "$value" | awk '
		{
			n = 0
			while (match($0, /[A-Za-z0-9+\/=_-]{32,}/)) {
				run = substr($0, RSTART, RLENGTH)
				split("", freq)
				for (i = 1; i <= length(run); i++) freq[substr(run, i, 1)]++
				h = 0
				for (c in freq) { p = freq[c] / length(run); h -= p * log(p) / log(2) }
				if (h >= 3.5) n = 1
				$0 = substr($0, RSTART + RLENGTH)
			}
			exit (n ? 0 : 1)
		}'; then
		scan_error "malformed term set at line $lineno: value contains a high-entropy opaque run"
	fi
}

# ------------------------------------------------------------------------------
# Term set. Validated before it is trusted; every failure is exit 2.
# ------------------------------------------------------------------------------

[[ -e "$terms_file" ]] || scan_error "term set is absent: publication is ineligible"
[[ -r "$terms_file" ]] || scan_error "term set is unreadable: publication is ineligible"

normalized="$WORK/terms.tsv"
: >"$normalized"

lineno=0
while IFS= read -r raw || [[ -n "$raw" ]]; do
	lineno=$((lineno + 1))
	[[ -z "${raw//[[:space:]]/}" ]] && continue
	[[ "${raw#"${raw%%[![:space:]]*}"}" == \#* ]] && continue

	# `read` with IFS=tab splits, and a fourth field means the line is wrong.
	IFS=$'\t' read -r cls kind value extra <<<"$raw"
	[[ -n "${extra:-}" ]] && scan_error "malformed term set at line $lineno: more than three fields"
	[[ -n "${cls:-}" && -n "${kind:-}" && -n "${value:-}" ]] ||
		scan_error "malformed term set at line $lineno: three tab-separated fields are required"
	[[ "$TERM_CLASSES" == *" $cls "* ]] || scan_error "malformed term set at line $lineno: unknown class"
	[[ "$TERM_KINDS" == *" $kind "* ]] || scan_error "malformed term set at line $lineno: unknown kind"

	if [[ "$kind" == regex ]]; then
		printf '' | grep -qE -- "$value" 2>/dev/null
		[[ $? -le 1 ]] || scan_error "malformed term set at line $lineno: value is not a usable regular expression"
	fi

	reject_credential_shaped_term "$value" "$lineno"

	printf '%s\t%s\t%s\n' "$cls" "$kind" "$value" >>"$normalized"
done <"$terms_file"

[[ -s "$normalized" ]] ||
	scan_error "term set is empty: an empty set cannot be distinguished from having no private terms, so publication is ineligible"

# ------------------------------------------------------------------------------
# Term screening. Paths are screened too, and a prohibited path is reported as
# `<blocked-path>` rather than printed.
# ------------------------------------------------------------------------------

screen_path() {
	local candidate=$1 cls kind value
	while IFS=$'\t' read -r cls kind value; do
		if [[ "$kind" == literal ]]; then
			[[ "$candidate" == *"$value"* ]] && {
				printf '<blocked-path>'
				return
			}
		else
			printf '%s' "$candidate" | grep -qE -- "$value" && {
				printf '<blocked-path>'
				return
			}
		fi
	done <"$normalized"
	printf '%s' "$candidate"
}

label_for_file() {
	# label_for_file <input-file>
	#
	# An input this script staged itself (`--text`, `--names-list`) keeps its label
	# beside it; every other input is named by its own path.
	if [[ "$1" == "$WORK/"* && -r "$1.label" ]]; then
		printf '%s' "$(<"$1.label")"
	else
		printf '%s' "$1"
	fi
}

screen_all_terms() {
	# One pass per term over every input finds the inputs that match; only those
	# are read again for line numbers. Screening input by input would start one
	# grep per input per term, which on a large tracked tree is hundreds of
	# thousands of processes.
	local list="$WORK/screen.list" matched="$WORK/screen.matched" cls kind value mode file path hits n
	printf '%s\0' "${input_files[@]}" >"$list"
	while IFS=$'\t' read -r cls kind value; do
		mode=F
		[[ "$kind" == regex ]] && mode=E
		# grep exits 1 when a batch has no match, which is not a failure; anything
		# above that means a batch was never screened, and that blocks.
		xargs -0 sh -c 'm=$1 v=$2; shift 2; grep -l"$m" --null -- "$v" "$@"; [ $? -le 1 ]' sh "$mode" "$value" \
			<"$list" >"$matched" 2>/dev/null ||
			scan_error "term screening did not run"
		while IFS= read -r -d '' file; do
			path=$(screen_path "$(label_for_file "$file")")
			# Digits only: a match in a binary file yields a notice rather than a line
			# number, and that notice names the file. It is reported at line 0 instead.
			hits=$(grep -n"$mode" -- "$value" "$file" 2>/dev/null | cut -d: -f1 | grep -E '^[0-9]+$')
			if [[ -z "$hits" ]]; then
				emit_finding "$cls" "$path" 0
				continue
			fi
			while IFS= read -r n; do
				[[ -n "$n" ]] && emit_finding "$cls" "$path" "$n"
			done <<<"$hits"
		done <"$matched"
	done <"$normalized"
}

# ------------------------------------------------------------------------------
# TruffleHog. Bootstrapped once into a cache outside the repository, verified
# by digest before extraction, and run offline afterwards.
# ------------------------------------------------------------------------------

platform() {
	local os arch
	case "$(uname -s)" in
	Darwin) os=darwin ;;
	Linux) os=linux ;;
	*) return 1 ;;
	esac
	case "$(uname -m)" in
	x86_64 | amd64) arch=amd64 ;;
	arm64 | aarch64) arch=arm64 ;;
	*) return 1 ;;
	esac
	printf '%s_%s' "$os" "$arch"
}

bootstrap_trufflehog() {
	local plat want cache dir tarball actual
	plat=$(platform) || scan_error "unsupported platform: refusing to scan"
	want=$(trufflehog_digest "$plat") || scan_error "no approved digest for this platform"

	cache="${PUBLIC_SAFETY_CACHE:-${XDG_CACHE_HOME:-$HOME/.cache}/ose-public-safety}"
	dir="$cache/trufflehog/$TRUFFLEHOG_VERSION/$plat"
	TRUFFLEHOG_BIN="$dir/trufflehog"

	if [[ -x "$TRUFFLEHOG_BIN" ]]; then
		return 0
	fi

	mkdir -p "$dir" || scan_error "cannot create the scanner cache"
	tarball="$WORK/trufflehog.tar.gz"

	# The only network access in this script, and only when the exact pinned
	# version is absent from the cache.
	curl -sSfL --max-time 180 -o "$tarball" \
		"https://github.com/trufflesecurity/trufflehog/releases/download/v${TRUFFLEHOG_VERSION}/trufflehog_${TRUFFLEHOG_VERSION}_${plat}.tar.gz" ||
		scan_error "cannot download the pinned scanner"

	actual=$(shasum -a 256 "$tarball" | cut -d' ' -f1)
	[[ "$actual" == "$want" ]] || scan_error "scanner digest mismatch: refusing to extract"

	tar -xzf "$tarball" -C "$dir" trufflehog || scan_error "cannot extract the pinned scanner"
	chmod +x "$TRUFFLEHOG_BIN" || scan_error "cannot make the scanner executable"
	[[ -x "$TRUFFLEHOG_BIN" ]] || scan_error "the scanner is not executable after extraction"
}

input_label() {
	# input_label <scanner-reported-path>
	#
	# The scanner reports the file it read, which is a staged copy under this
	# run's temporary directory: a machine-specific absolute path that names
	# nothing a reader can act on. Only the file name is kept, and a staged
	# copy's `input-<i>` becomes the label its input was given. No directory
	# prefix is compared, because the scanner normalises the path it was handed
	# (a `TMPDIR` ending in `/` leaves `//` in it) before reporting it.
	local name=${1##*/}
	if [[ "$name" =~ ^input-([0-9]+)$ && -n "${input_labels[${BASH_REMATCH[1]}]+set}" ]]; then
		printf '%s' "${input_labels[${BASH_REMATCH[1]}]}"
	else
		printf '%s' "$name"
	fi
}

# Raw stdout flows only through this pipe into jq. No raw temporary file, no
# artifact, no debug log. jq emits three fields; nothing else survives.
credential_scan() {
	# credential_scan <directory>
	local dir=$1 raw_err rc records detector path n
	raw_err="$WORK/scanner.err"

	records=$("$TRUFFLEHOG_BIN" filesystem "$dir" \
		--json --no-verification --no-update --fail --fail-on-scan-errors \
		2>"$raw_err" |
		jq -r -c 'select(type == "object" and has("DetectorName"))
		          | [ .DetectorName,
		              (.SourceMetadata.Data.Filesystem.file // "<unknown>"),
		              (.SourceMetadata.Data.Filesystem.line // 0) ]
		          | @tsv' 2>"$WORK/jq.err")
	rc=$?

	# stderr is read for classification and discarded without display.
	if [[ -s "$WORK/jq.err" ]]; then
		: >"$WORK/jq.err"
		scan_error "scanner output did not match the expected record shape"
	fi
	: >"$raw_err"

	# 0 = nothing found, 183 = findings (the --fail contract). Anything else is
	# a scan error, which blocks.
	if [[ "$rc" -ne 0 && "$rc" -ne 183 ]]; then
		scan_error "the credential scan did not complete"
	fi

	while IFS=$'\t' read -r detector path n; do
		[[ -z "${detector:-}" ]] && continue
		emit_finding "$detector" "$(screen_path "$(input_label "$path")")" "${n:-0}"
	done <<<"$records"
}

# ------------------------------------------------------------------------------
# Canary. Proves detection AND non-disclosure before any real material is read.
# ------------------------------------------------------------------------------

run_canary() {
	local dir value out detected real_findings scan_rc

	dir=$(mktemp -d "${TMPDIR:-/tmp}/public-safety-canary.XXXXXX") || scan_error "cannot create the canary directory"

	# Generated here, never committed, and never printed. A real RSA key rather
	# than a token-shaped string: the token detectors validate a checksum, so a
	# random `ghp_...` proves nothing about whether detection works.
	openssl genrsa -out "$dir/canary.pem" 2048 2>/dev/null ||
		scan_error "cannot generate the canary key"
	value=$(sed -n '3p' "$dir/canary.pem")
	[[ -n "$value" ]] || scan_error "the canary key is not in the expected form"

	# The canary keeps its own ledger so a proof never becomes a real finding.
	real_findings="$FINDINGS_FILE"
	FINDINGS_FILE="$WORK/canary-findings.txt"
	: >"$FINDINGS_FILE"

	# `scan_error` inside a command substitution exits only the subshell, so the
	# substitution's own status is what says whether the canary scan survived.
	out=$(credential_scan "$dir" 2>&1)
	scan_rc=$?
	detected=$(wc -l <"$FINDINGS_FILE" | tr -d ' ')

	if [[ "$scan_rc" -ne 0 ]]; then
		: >"$FINDINGS_FILE"
		rm -rf "$dir"
		FINDINGS_FILE="$real_findings"
		scan_error "the canary scan could not complete: the scanner cannot be trusted"
	fi

	if [[ "$out$(cat "$FINDINGS_FILE")" == *"$value"* ]]; then
		: >"$FINDINGS_FILE"
		rm -rf "$dir"
		FINDINGS_FILE="$real_findings"
		scan_error "the canary value reached the output: the sanitizer cannot be trusted"
	fi

	: >"$FINDINGS_FILE"
	FINDINGS_FILE="$real_findings"
	rm -rf "$dir"

	[[ "$detected" -ge 1 ]] || scan_error "the canary produced no detection: the scanner cannot be trusted"
	[[ -d "$dir" ]] && scan_error "the canary directory survived"
	return 0
}

# ------------------------------------------------------------------------------
# Run
# ------------------------------------------------------------------------------

bootstrap_trufflehog
run_canary

screen_all_terms

# Every typed input is staged under one directory so the credential scan sees
# text and files alike, under names that carry no private material. A hard link
# stages an input without copying it where both share a file system.
scan_dir="$WORK/inputs"
mkdir -p "$scan_dir"
for i in "${!input_files[@]}"; do
	ln -- "${input_files[$i]}" "$scan_dir/input-$i" 2>/dev/null ||
		cp -- "${input_files[$i]}" "$scan_dir/input-$i" 2>/dev/null ||
		scan_error "cannot stage an outbound input for scanning"
done
credential_scan "$scan_dir"

sort -u "$FINDINGS_FILE" >"$WORK/findings-unique.txt" && mv "$WORK/findings-unique.txt" "$FINDINGS_FILE"
findings=$(wc -l <"$FINDINGS_FILE" | tr -d ' ')
if [[ "$findings" -gt 0 ]]; then
	cat "$FINDINGS_FILE"
	printf '[public-safety] %s: blocked, %s finding(s); publication must not proceed\n' "$surface" "$findings" >&2
	exit 1
fi

printf '[public-safety] %s: clean\n' "$surface"
exit 0
