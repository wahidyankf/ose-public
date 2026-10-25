---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

Drilling turns recognition into recall: thirty-six questions covering all sixteen concepts, eleven applied problems drawn from real incidents, eight hands-on katas with before-and-after solutions, a thirty-item self-check, and six design trade-off prompts with model answers. Work the questions closed-book, then check against the details blocks; run every kata in the harness. The method is retrieval first and verification second: answer from memory, read the model answer, then close the gap by running the mapped example and predicting its output before looking. A question you answer correctly twice, a week apart, is learned; anything else is merely read. For the katas, follow the same loop every time: read the starter and name the smell in one sentence, write your version without peeking at the solution, run it, then diff against the committed solution and account for every difference — a difference you cannot explain is a habit you have not learned yet. Keep a personal log of which questions you miss; the second pass through this page should take half the time of the first, and the items still red on the third pass are the ones to turn into flashcards.

## Recall Q&A

### Q1 (co-01): What three behaviours does `set -euo pipefail` change?

<details><summary>Answer</summary>

`-e` aborts on the first failing command instead of continuing; `-u` turns unset-variable expansion into an error instead of an empty string; `-o pipefail` makes a pipeline report failure when any stage fails instead of only the last. Together they convert silent corruption into immediate failure at the cause. The flags compose: `-e` without `-u` still lets typos through, and `-e` without `pipefail` still lets middle stages fail silently, which is why the course teaches the trio as one indivisible header rather than three independent options.

</details>

### Q2 (co-01): Why does a failing `grep` in `grep ERROR app.log | wc -l` report success without `pipefail`?

<details><summary>Answer</summary>

A pipeline's exit status is its last command's status, and `wc -l` succeeds because it counted zero lines happily. The grep failure in the middle is masked. `set -o pipefail` makes the pipeline report the grep failure, and testing the stage directly is the alternative.

</details>

### Q3 (co-11): What is the exit-code contract taught in this course?

<details><summary>Answer</summary>

Zero means success, one means a runtime failure, two means the caller misused the tool (bad flags, missing input). Callers script around these codes, so document the mapping and never change it: supervisors retry on one, page a human on two, continue on zero.

</details>

### Q4 (co-11): Why must `$?` be saved on the very next line?

<details><summary>Answer</summary>

Every command overwrites `$?`, including `echo`. Reading it three lines later yields a different command's status. Save it into a named variable immediately (`status=$?`), then branch on the variable, which documents what was captured.

</details>

### Q5 (co-02): How does a `shift` loop drain argv, and what ends the loop?

<details><summary>Answer</summary>

Each iteration reads `$1` as the queue head, handles it, then `shift` drops it so the next operand becomes the new `$1`. The loop condition `[ "$#" -gt 0 ]` ends the loop when the count reaches zero, so every operand is handled exactly once with no index arithmetic.

</details>

### Q6 (co-02): What does the `getopts` optstring `vo:` declare, and where do flags go after parsing?

<details><summary>Answer</summary>

`v` is a bare flag and `o:` takes an argument — the trailing colon makes `-o` consume the next word, delivered in `$OPTARG`. After the loop, `shift $((OPTIND - 1))` drops the parsed flags so `$1` is the first operand. Unknown letters arrive as `?`, which is where usage errors belong.

</details>

### Q7 (co-02): How do long options differ from `getopts`, and what does `--` do?

<details><summary>Answer</summary>

Long options need an explicit `shift` loop with a `case` on `$1`, because `getopts` only speaks single letters. Each consumed flag shifts once and value flags shift twice. A bare `--` ends option parsing so later words are operands even when they start with dashes.

</details>

### Q8 (co-02): What two checks guard a `--output FILE` value before consuming it?

<details><summary>Answer</summary>

Presence (`[ -z "${2-}" ]` catches a missing value safely under `-u`) and shape (rejecting a `$2` that looks like another flag). Both failure modes print usage to stderr and exit 2. Consuming two words with one shift loses an operand downstream.

</details>

### Q9 (co-02): When does `${var:-default}` differ from `${var-default}`?

<details><summary>Answer</summary>

`:-` substitutes on empty or unset, while `-` substitutes only when unset, so an explicitly empty string survives `-` but not `:-`. Neither form modifies the variable; only the expansion changes. Configuration usually wants `:-` and sentinel empties need `-`.

</details>

### Q10 (co-02): How does subcommand dispatch route `tool deploy` versus `tool status`?

<details><summary>Answer</summary>

A `case` on `$1` with one branch per verb: each branch shifts the verb off and calls its function with the remaining argv. Unknown verbs print the usage contract to stderr and exit 2. The dispatcher routes and forwards but never implements, so each verb owns its parsing.

</details>

### Q11 (co-02): What three things does a usage message answer, and where does it print?

<details><summary>Answer</summary>

What to type (synopsis with brackets for optionals), what each part means (one line per flag), and what happens next. It prints to stderr before any filesystem work, because stdout belongs to the tool's output contract and usage is not output. Bad input exits 2.

</details>

### Q12 (co-02): How do you enforce a required operand under `set -u` with possibly empty argv?

<details><summary>Answer</summary>

Test `${1-}` (safe when argv is empty) for emptiness, then print a named error (`SOURCE is required`), the usage contract, and exit 2. The check sits before any real work so a missing operand reads as a caller mistake, not a tool bug ten steps later.

</details>

### Q13 (co-08): Why does an unquoted `$name` holding `my report.txt` produce two words?

<details><summary>Answer</summary>

Word splitting applies to unquoted expansions using `IFS` separators, so the space divides the value into two fields before the command runs. Quoting (`"$name"`) suppresses splitting for that expansion. The rule is quote by default and unquote only when splitting is the explicit intent.

</details>

### Q14 (co-08): When do single quotes beat double quotes?

<details><summary>Answer</summary>

Single quotes freeze text with zero expansion, which is what embedded little languages need: awk programs, sed expressions, SQL fragments, and templates a later tool expands. Double quotes expand variables and command substitution. Choosing wrong corrupts the text silently before the downstream tool ever sees it.

</details>

### Q15 (co-08): What decides whether `*.log` expands or stays literal?

<details><summary>Answer</summary>

Quoting at the use site: unquoted, the shell expands the pattern to matching files before the command runs; quoted, the pattern survives as literal text. Store patterns quoted and expand them unquoted exactly where matching is intended. An unmatched pattern expands to itself unless `nullglob` is set.

</details>

### Q16 (co-08): How do you scope an `IFS` change so it cannot leak?

<details><summary>Answer</summary>

Prefix the single command (`IFS=: read ...`), assign and restore around the smallest block, or use `local IFS` inside functions. A global `IFS` change is action at a distance that breaks distant splits untraceably. When separators are data-dependent, prefer parameter expansion over separator surgery.

</details>

### Q17 (co-04): Why must a variables-setting loop avoid pipes?

<details><summary>Answer</summary>

Each pipeline stage runs in a subshell, so variables set inside a piped `while` loop vanish when the loop ends. Redirecting into the loop (`done < file`, `done < <(...)`, `done <<EOF`) keeps the loop in the current shell and every assignment survives. The loop runs identically; only the shell differs.

</details>

### Q18 (co-02): What is the one line that forwards arguments losslessly through a wrapper?

<details><summary>Answer</summary>

`inner "$@"` — quoted `"$@"` expands to each positional parameter as its own intact word. Every layer (caller, wrapper, inner tool) needs the same quotes; one bare `$@` anywhere resplits spaced arguments for the whole chain. Prepend wrapper flags before `"$@"` to preserve positions.

</details>

### Q19 (co-03): What three lines make scratch safe, and why `mktemp -d`?

<details><summary>Answer</summary>

Create with `mktemp -d`, trap its removal with `trap cleanup EXIT`, then work inside it. Fixed paths collide between parallel runs while unique dirs never do; traps remove the dir on every exit path so green runs leave no droppings. Nothing outside /tmp is touched.

</details>

### Q20 (co-03): How does an EXIT trap differ from an ERR trap?

<details><summary>Answer</summary>

EXIT fires once when the shell exits on any path (success, error, signal) and is for cleanup; ERR fires after each failing command and is for reporting, with `$BASH_COMMAND` naming the failure. Cleanup handlers remove resources, reporters print one line. Keep both tiny because they run in the worst moment of the script.

</details>

### Q21 (co-03): Why does `mkdir` make a correct lock while `touch` does not?

<details><summary>Answer</summary>

Directory creation is atomic: exactly one contender wins and the loser gets a clean failure, while `touch` plus existence checks race. The winner traps `rmdir` on EXIT so the lock releases on every path; the loser prints a back-off message and exits 1. Never skip the trapped release.

</details>

### Q22 (co-12): How do you publish results so a crash leaves nothing half-written?

<details><summary>Answer</summary>

Stage every part privately in scratch, then publish atomically — print only at the end or rename into place. A crash before publish leaves partials that the EXIT trap removes, and consumers only ever see whole results or nothing. Partial outputs disguised as complete ones are worse than no output.

</details>

### Q23 (co-09): How do indexed and associative arrays differ in creation and reading?

<details><summary>Answer</summary>

Indexed arrays use parentheses (`arr=(a b)`) with numeric indexes, `${arr[i]}`, counts via `${#arr[@]}`, and quoted `"${arr[@]}"` iteration. Associative arrays need `declare -A` with string keys (`map[key]=value`), the same count and iteration forms, sorted keys for deterministic output, and `:-` guards on first-sight increments under `-u`.

</details>

### Q24 (co-16): What makes output golden-testable, and what must it never contain?

<details><summary>Answer</summary>

Fixed argv, committed fixtures, trapped scratch, ordered reads after `wait`, sorted keys, and masked or absent PIDs, paths, versions, dates, and usernames. Golden tests assert the whole observable behaviour in one file; any machine-specific byte makes them red for reasons nobody committed. Nondeterminism is a defect, not a property.

</details>

### Q25 (co-02): How do you parse `--output FILE` when the value itself starts with a dash?

<details><summary>Answer</summary>

You do not accept it positionally: a value starting with a dash is indistinguishable from the next flag, so the parser rejects it with the missing-value guard and tells the caller to use `--output=FILE` or `--` separation instead. The guard that checks whether the value looks like a flag exists exactly for this collision. Deterministic parsers refuse ambiguity rather than guessing which word the caller meant.

</details>

### Q26 (co-03): What runs when both an ERR trap and `set -e` are active, and in which order?

<details><summary>Answer</summary>

The failing command triggers the ERR trap first, which reports with `$BASH_COMMAND`, and then `set -e` aborts the script unless the failure was in an explicitly guarded position. The trap reports, the flag decides. That is why the reporter must be side-effect free: it runs in the instant before the abort, when the script state is at its most broken.

</details>

### Q27 (co-09): Why sort associative-array keys with `LC_ALL=C` instead of plain `sort`?

<details><summary>Answer</summary>

Plain `sort` follows the machine locale, so mixed-case keys order differently on different systems and the golden transcript drifts. `LC_ALL=C` sorts by byte value identically everywhere, and iterating the sorted keys turns hash order into a fixed sequence. Deterministic output needs both steps: collect in the map, print in sorted order.

</details>

### Q28 (co-06): When does a background job's output stay deterministic without files?

<details><summary>Answer</summary>

Only when exactly one job writes while the others stay silent, or when every write is joined by `wait` before the next read begins. Two jobs sharing one stream interleave nondeterministically by construction, and no sleep tuning fixes that reliably. Per-job files plus ordered reads after the join are the general answer; shared streams are the special case that usually fails.

</details>

### Q29 (co-07): How do you restore the default disposition after ignoring SIGHUP?

<details><summary>Answer</summary>

`trap - HUP` removes the ignore handler and reinstalls the default, which terminates the script on hangup again. The ignore-then-restore pair scopes the leniency to the detachable section only: earlier and later code keeps the protective default. Forgetting the restore leaves the script unexpectedly immune, so the restore line sits immediately after the section it protects.

</details>

### Q30 (co-09): What is the difference between `mapfile -t` and capturing command substitution into an array?

<details><summary>Answer</summary>

`mapfile -t` reads lines intact with newlines stripped, preserving spaces and glob characters, while `arr=($(cmd))` splits every line on `IFS` and expands globs before assignment. The substitution form mangles exactly the inputs that look innocent: filenames with spaces and patterns with stars. Line-oriented input deserves the line-oriented loader, fed by redirection so the array lands in the current shell.

</details>

### Q31 (co-16): Why do exit-code tests save `$?` immediately instead of asserting inside the probe?

<details><summary>Answer</summary>

Any intervening command overwrites the status being asserted, so saving it on the next line freezes the evidence and the assertion reads the frozen copy. Probes that assert inline couple the observation to the observation tool, which is how a passing suite hides a broken contract.

</details>

### Q32 (co-03): How does a single EXIT handler serve both TERM and plain exit without double cleanup?

<details><summary>Answer</summary>

The TERM trap runs the shared handler, disarms EXIT with `trap - EXIT`, and exits explicitly; the plain-exit path reaches the armed EXIT trap instead. Exactly one path fires because the first one disarms the other. The handler names which path it served, so post-mortems distinguish stops from crashes without guessing.

</details>

### Q33 (co-10): When do you quote a heredoc delimiter, and what breaks when you choose wrong?

<details><summary>Answer</summary>

Quote the delimiter to freeze the body for downstream tools that expand it themselves; leave it bare to let the shell fill the template. Choosing wrong corrupts silently in both directions: quoted-when-bare leaves `$VAR` placeholders in output meant for humans, bare-when-quoted expands secrets into logs and pre-corrupts templates. Literal is the safer default when in doubt.

</details>

### Q34 (co-13): What belongs in a log line, and how does verbosity gate it?

<details><summary>Answer</summary>

A fixed prefix naming the tool and level so logs stay greppable, the progress fact itself, and nothing machine-specific. Always-print lines mark progress operators watch for; debug lines hide behind a verbosity gate that is quiet by default and verbose on request. No bare echoes remain: one entry point means one place to change the format later.

</details>

### Q35 (co-14): When do you choose single brackets over double, and what declares the choice?

<details><summary>Answer</summary>

Single brackets when the script must run under dash, busybox, or minimal containers; double brackets when the script already requires bash and needs pattern matching or safer empty handling. The target shells are declared up front, and the leanest target decides. Portable by default, bash-only on purpose — never by accident.

</details>

### Q36 (co-15): What three mechanical greps open every shell review, and what stays human?

<details><summary>Answer</summary>

Unquoted echo expansions (`echo \$`), backtick command substitution, and unquoted variables inside test brackets — each reported with its line number from a committed sample. What stays human is intent: whether a deliberate split is wanted, which only the surrounding comment can say. Mechanical checks run in CI; stylistic judgement stays with reviewers.

</details>

## Applied problems

### Problem 1: The missing quote that breaks on spaces

A deploy script takes an artifact path argument and fails whenever Jenkins passes a workspace path containing a space. Reproduce with a fixed demo value holding a space, show the split with a word count, then quote the expansion and show one intact word. State the rule the fix follows and where else in the script the same fix applies. Work it like Example 18: count the split first so the bug is measured, quote the expansion second so the fix is visible, then grep the script for every other bare expansion of the same variable, because the same value flows through logging, validation, and the final call, and each unquoted use is the same bug waiting for a pathname with a space.

### Problem 2: The trap that cleans a temp dir on every exit path

A report generator stages CSV parts in /tmp and leaks them whenever the database step fails. Add `mktemp -d` creation, an EXIT trap that removes the dir and prints a fixed marker, and probes for the success and failure paths proving both markers print. No fixed /tmp paths may remain. Work it like Examples 26 and 28: one creation line plus one trap line before any work, then a subshell per exit path so both markers print in a single run. Check the marker, not the directory: asserting absence of a random path is impossible, while the fixed marker proves the handler ran on each path.

### Problem 3: The five-flag option parser

Design an option parser for a backup tool with `--source DIR`, `--dest DIR`, `--keep N`, `--dry-run`, and `--verbose`: defaults for all five, presence and shape guards on the three value flags, usage on stderr with exit 2 for anything else, and a closing echo block printing the parsed values. Demo argv must be fixed so the output is golden-stable. Work it like Examples 12 and 13: one default per flag at the top so reviewers see the whole contract, two shifts per value flag with the presence-and-shape guard before consuming, bare flags shifting once. Feed one fixed demo argv exercising every flag, and confirm the closing echo block shows all five values exactly as passed.

### Problem 4: The flaky parallel test

A suite fans three checks out with `&` and reads a shared results file, producing interleaved lines. Redesign so each check writes its own file under scratch, one `wait` joins all three, and ordered reads produce the fixed transcript. Explain why files serialize what a shared stream cannot. Work it like Examples 44 and 54: one scratch dir, one file per job so no two writers share a byte stream, a bare `wait` before any read, then `cat` in name order. Run the suite twice and diff the transcripts: identical bytes prove the race is gone, where the shared-file version drifts on every other run.

### Problem 5: The masked pipeline in CI

A gate runs `generate | validate` and passes while generation fails silently. Diagnose the masking with a quiet-grep probe, fix it with `pipefail`, and mark the one accepted-failure site with an explicit handler. Show the status before and after with fixed labels. Work it like Example 3: first print the masked status to prove the lie exists, then enable `pipefail` and print the honest status, then decide per stage — a stage whose failure is genuinely fine earns an explicit `||` handler with a comment, while every other stage stays strict. The gate is only trustworthy when each accepted failure is named.

### Problem 6: The signal-unsafe deploy

A deploy script stages files and dies on SIGTERM mid-stage, leaving half the set behind. Add a TERM handler that finishes the current package and reports, stage into scratch instead of the target, and publish with a verification count. Prove the handler with a deterministic self-signal in the transcript. Work it like Examples 31 and 59: stage into scratch so nothing half-written is ever visible, install the TERM handler before the loop so early signals are covered, finish the in-flight package inside the handler, and close with a count that reconciles staged versus expected. The self-signal in the transcript is the proof auditors look for.

### Problem 7: The locale-dependent golden

A sorting test passes locally and fails in CI because the two machines order mixed-case words differently. Pin the order with `LC_ALL=C`, explain in one paragraph why the C locale is the only shared order, and state where the pin belongs (the command, not the environment). Work it like Example 70: reproduce with a mixed-case fixture that exposes the interleave, pin the sort command itself so messages stay localized while data stays byte-ordered, and document the uppercase-first order where readers will see it. Never export the locale globally: a global pin changes messages, collation, and character classes for the whole script.

### Problem 8: The untested exit contract

A CLI returns 0, 1, and 2 but no test asserts the mapping, so a refactor swaps misuse and failure silently. Write three probes pinning 2-0-1 with a fixed closing marker, keeping usage on stderr and stdout golden-clean. State what breaks first when someone remaps the codes. Work it like Example 77: relax strict mode for the probe block only, save each `$?` on the next line, assert against the contract table, and restore strict mode before the verdict. Declare the stderr-ignore rule for that unit so usage stays on stderr where it belongs. When someone remaps the codes, these probes fail before any caller script does.

### Problem 9: The config table refactor

A deploy script chains if-elif branches on environment names, and adding a fifth environment means touching every branch. Refactor the chain into one associative lookup table with documented defaults, so the fifth environment adds one pair and the sixth will too. State what adding the next environment costs in each shape: one branch plus tests versus one data line. Work it like Example 42: initialize the table in place, read known keys directly, default the rest at the use site, and keep the table greppable so reviewers audit data instead of control flow.

### Problem 10: The network-dependent test

A test curls a staging endpoint and fails in every sandbox without network, so CI stays red for reasons nobody committed. Stub the client with a same-named shell function that echoes its fixed arguments, keep the call shape production-true, and assert what the code asked rather than what the network answered. State what the stub cannot prove: live response shapes, auth expiry, and rate limits still need a few contract tests outside the unit suite. Work it like Example 76: one stub per tool, fail loudly on unexpected arguments, and never let a URL leave the harness.

### Problem 11: The review that grep runs

A four-hundred-line script lands for review with suspected quoting slips and nobody has time to read every expansion. Write three mechanical greps over a committed sample — unquoted echo expansions, backtick substitution, unquoted variables in test brackets — report each hit with its line number, and state what stays human judgment: whether a deliberate split is intended, which only the surrounding comment can say. Work it like Example 68: commit the bad-good sample pair so the team shares one definition of wrong, run the greps in CI, and spend reviewer attention on logic instead of quoting.

## Code katas

Eight hands-on katas. Each starts from the `Before` starter, and the `After` reference shows one good solution with its recorded output. Write your version before peeking at the reference, then diff and account for every difference. Work them in order: strict mode and parsing first, because flags and cleanup underlie everything; signals and quoting next, because they train the two reflexes production scripts demand; idempotence and logging last, because they isolate one deployment judgement each.

### Kata 01: Convert a Script to Strict Mode

(Concepts: co-01.)

Prove the header first: a misspelled variable under lax mode expands to nothing and the script stays green. Start from the starter, which hides the typo, and match the reference that adds the strict header plus a presence guard. Done looks like a two-line transcript where the corrected variable prints and the guard never fires — and like a version where deleting one letter aborts the run with the variable named.

**Before** (`drilling/code/kata-01-strict-mode-conversion/before/starter.sh`):

```bash
# => Kata 1 starter: a typo hides inside lax mode and the script stays green.
# => The misspelled variable expands to nothing; nobody notices.
# shellcheck disable=SC2034,SC2154 # rationale: starter ships the typo the kata must fix
name="report.txt"         # => the variable the script means to use
echo "building: ${outpt}" # => TYPO: expands empty under lax mode
echo "done"               # => prints although the line above produced garbage
```

**After** (`drilling/code/kata-01-strict-mode-conversion/after/solution.sh`):

```bash
# => Kata 1 solution: strict flags turn the typo into a loud failure.
set -euo pipefail # => strict header first, as in every script
# => WHY strict first: -u rejects the misspelled variable immediately.
name="report.txt"         # => the variable the script means to use
if [ -n "${name}" ]; then # => guard proves the value exists before use
	echo "building: ${name}" # => quoted: the correct variable, intact
fi                        # => closes the presence guard
echo "done"               # => prints only after real work succeeded
```

**Output** (`drilling/code/kata-01-strict-mode-conversion/expected/main.stdout.txt`):

```text
building: report.txt
done
```

### Kata 02: Add Signal Handling to a Loop

(Concepts: co-07.)

Remove the silent keyboard death: the starter loops with no handler, so Ctrl-C kills without cleaning. Start from the starter and match the reference that traps INT, reports the in-flight step, and proves the handler with a deterministic self-signal. Done looks like three step lines, one interrupt line, and a closing marker proving the handler returned instead of exiting.

**Before** (`drilling/code/kata-02-signal-handler-loop/before/starter.sh`):

```bash
# => Kata 2 starter: a three-step loop with no signal handling at all.
# => Ctrl-C mid-loop would kill it without cleaning the step files.
set -euo pipefail             # => strict, but strict alone does not catch signals
for step in one two three; do # => three fixed steps, no interruptions handled
	echo "step: ${step}"         # => each step prints in fixed order
done                          # => all three steps ran
```

**After** (`drilling/code/kata-02-signal-handler-loop/after/solution.sh`):

```bash
# => Kata 2 solution: an INT trap reports the step, then the loop finishes.
set -euo pipefail # => strict header first, as in every script
# => WHY trap before work: signals arrive at any moment, including line one.
on_interrupt() {                # => the INT handler: report, then keep going
	echo "interrupted at: ${step}" # => names the step in flight, fixed here
}                               # => closes the interrupt handler
trap on_interrupt INT           # => SIGINT reports instead of killing silently
step="none"                     # => default before the loop starts
for step in one two three; do   # => three fixed steps, interruptible
	echo "step: ${step}"           # => each step prints in fixed order
done                            # => all three steps ran
kill -INT $$                    # => self-signal proves the handler runs deterministically
echo "loop done"                # => reached: the handler returned, did not exit
```

**Output** (`drilling/code/kata-02-signal-handler-loop/expected/main.stdout.txt`):

```text
step: one
step: two
step: three
interrupted at: three
loop done
```

### Kata 03: Write a Fixture-Based Test

(Concepts: co-16.)

Replace eyeballs with goldens: the starter prints output for a human to judge. Start from the starter and match the reference that captures to scratch and asserts with silent `cmp` against the committed golden file. Done looks like a passing line for the green run, and like a failing line plus exit 1 when you change one golden byte and rerun.

**Before** (`drilling/code/kata-03-fixture-based-test/before/starter.sh`):

```bash
# => Kata 3 starter: eyeball verification, nothing asserted.
# => The output prints and a human decides whether it looks right.
set -euo pipefail            # => strict header first, as in every script
printf "users: 3\n"          # => the output under test, printed for eyeballs
echo "eyeball: looks right?" # => a human answers; the suite cannot
```

**After** (`drilling/code/kata-03-fixture-based-test/after/solution.sh`):

```bash
# => Kata 3 solution: the same output asserted against a golden file.
set -euo pipefail # => strict header first, as in every script
# => WHY golden files: committed snapshots decide, humans only review diffs.
actual="$(mktemp)"                           # => capture file under /tmp, never in the repo
cleanup() {                                  # => remove the capture on every exit path
	rm -f "${actual}"                           # => the capture file vanishes with the script
}                                            # => closes the capture cleaner
trap cleanup EXIT                            # => removal runs on success, error, or signal exits
printf "users: 3\n" >"${actual}"             # => the output under test, captured
if cmp -s "${actual}" after/golden.txt; then # => silent compare: status only
	echo "test passes"                          # => byte-identical to the committed snapshot
else                                         # => any byte differs
	echo "test fails"                           # => the golden file caught a behaviour change
	exit 1                                      # => red tests exit nonzero so suites notice
fi                                           # => closes the golden comparison
```

**`drilling/code/kata-03-fixture-based-test/after/golden.txt`**:

```text
users: 3
```

**Output** (`drilling/code/kata-03-fixture-based-test/expected/main.stdout.txt`):

```text
test passes
```

### Kata 04: Parse an Option Set with Five Flags

(Concepts: co-02.)

Free the buried values: the starter hardcodes behaviour in the body with no flags at all. Start from the starter and match the reference that parses two bare and three value flags with defaults, guards, and usage on stderr. Done looks like five parsed-value lines matching the demo argv, plus a misuse probe where a sixth flag prints usage and exits 2.

**Before** (`drilling/code/kata-04-five-flag-option-parser/before/starter.sh`):

```bash
# => Kata 4 starter: fixed values buried in the body, no flags at all.
# => Every behaviour change means editing the script itself.
set -euo pipefail          # => strict header first, as in every script
verbose="no"               # => buried default: callers cannot change it
output="stdout"            # => buried default: callers cannot change it
echo "verbose: ${verbose}" # => always no, whatever the caller wants
echo "output: ${output}"   # => always stdout, whatever the caller wants
```

**After** (`drilling/code/kata-04-five-flag-option-parser/after/solution.sh`):

```bash
# => Kata 4 solution: five flags parsed with validation and defaults.
set -euo pipefail # => strict header first, as in every script
# => WHY fixed demo argv: five parsed flags must show constant output.
set -- --verbose --output report.txt --count 3 --dry-run --mode fast               # => demo argv
verbose="no"                                                                       # => default one: quiet unless asked
output="stdout"                                                                    # => default two: stdout unless redirected
count="1"                                                                          # => default three: one repetition unless asked
dry_run="no"                                                                       # => default four: real run unless asked
mode="safe"                                                                        # => default five: safe unless asked
usage() {                                                                          # => one function owns the whole usage contract
	echo "usage: tool [--verbose] [--output FILE] [--count N] [--dry-run] [--mode M]" # => synopsis
}                                                                                  # => closes the usage contract
while [ "$#" -gt 0 ]; do                                                           # => loop while words remain
	case "$1" in                                                                      # => match the head word against the five flags
	--verbose)
		verbose="yes"
		shift # => bare flag flips its default on
		;;    # => ends the verbose branch
	--output)
		output="$2"
		shift 2 # => value flag consumes its word
		;;      # => ends the output branch
	--count)
		count="$2"
		shift 2 # => value flag consumes its word
		;;      # => ends the count branch
	--dry-run)
		dry_run="yes"
		shift # => bare flag flips its default on
		;;    # => ends the dry-run branch
	--mode)
		mode="$2"
		shift 2 # => value flag consumes its word
		;;      # => ends the mode branch
	--help)
		usage
		exit 0 # => help prints the contract and succeeds
		;;     # => ends the help branch
	*)
		usage >&2
		exit 2                   # => unknown words are usage errors
		;;                       # => ends the misuse branch
	esac                      # => closes the per-word branch
done                       # => all five flags parsed; defaults stand where flags were absent
echo "verbose: ${verbose}" # => shows the flipped bare flag
echo "output: ${output}"   # => shows the consumed value word
echo "count: ${count}"     # => shows the consumed value word
echo "dry-run: ${dry_run}" # => shows the flipped bare flag
echo "mode: ${mode}"       # => shows the consumed value word
```

**Output** (`drilling/code/kata-04-five-flag-option-parser/expected/main.stdout.txt`):

```text
verbose: yes
output: report.txt
count: 3
dry-run: yes
mode: fast
```

### Kata 05: Trap Cleanup for a Temp Dir

(Concepts: co-03.)

Remove collisions and leaks together: the starter uses a fixed /tmp path with no cleanup. Start from the starter and match the reference that uses `mktemp -d` plus an EXIT trap with a proving marker. Done looks like the work line followed by the cleaned marker on the success path, and the same marker after a forced failure.

**Before** (`drilling/code/kata-05-trap-tempdir-cleanup/before/starter.sh`):

```bash
# => Kata 5 starter: a fixed scratch path with no cleanup at all.
# => Reruns collide and crashed runs leak the directory behind.
set -euo pipefail             # => strict header first, as in every script
scratch="/tmp/kata05-scratch" # => FIXED path: collides between parallel runs
mkdir -p "${scratch}"         # => stale files from crashed runs survive here
echo "scratch: fixed path"    # => fixed label hides the collision risk
```

**After** (`drilling/code/kata-05-trap-tempdir-cleanup/after/solution.sh`):

```bash
# => Kata 5 solution: mktemp plus an EXIT trap, no leaks, no collisions.
set -euo pipefail # => strict header first, as in every script
# => WHY mktemp: fixed paths collide between parallel harness runs.
scratch="$(mktemp -d)"      # => private scratch dir under /tmp, writable here
cleanup() {                 # => the exit handler: remove scratch, confirm loudly
	rm -rf "${scratch}"        # => remove the private scratch dir
	echo "cleaned"             # => fixed marker proves the trap actually ran
}                           # => closes the exit handler
trap cleanup EXIT           # => run cleanup on success, error, or signal exits
touch "${scratch}/work.txt" # => prove the scratch dir is usable
echo "work done"            # => fixed marker: real work would happen here
```

**Output** (`drilling/code/kata-05-trap-tempdir-cleanup/expected/main.stdout.txt`):

```text
work done
cleaned
```

### Kata 06: Handle a Filename with Spaces

(Concepts: co-08.)

Keep the spaced name whole: the starter counts two words where one file stands. Start from the starter and match the reference that globs unquoted and uses quoted, visiting both fixtures whole. Done looks like one bracketed line per fixture with the spaced name intact and a total of two, beside a starter run showing two words for one file.

**Before** (`drilling/code/kata-06-quote-spaced-filename/before/starter.sh`):

```bash
# shellcheck disable=SC2034 # rationale: loop counts split words; the variable is intentionally never expanded
# => Kata 6 starter: an unquoted loop that splits the spaced name.
# => Two words where one file stands: the classic space bug.
set -euo pipefail       # => strict header first, as in every script
name="my file.txt"      # => the spaced value the loop below mangles
count=0                 # => word counter exposes the split below
for word in ${name}; do # => DELIBERATELY unquoted: watch it split
	count=$((count + 1))   # => count each word the split produced
done                    # => two turns prove the bug: one file became two words
echo "words: ${count}"  # => 2, not 1: the space split the name
```

**After** (`drilling/code/kata-06-quote-spaced-filename/after/solution.sh`):

```bash
# => Kata 6 solution: quoted iteration keeps the spaced name whole.
set -euo pipefail # => strict header first, as in every script
# => WHY quoted: the fixture name holds a space, like real filenames.
count=0                # => file counter proves the fixture was visited whole
for f in *.txt; do     # => glob UNQUOTED to match; use quoted inside
	count=$((count + 1))  # => count each matched file
	echo "file: [${f}]"   # => quoted use: the spaced name stays one word
done                   # => both fixtures visited, spaces intact
echo "total: ${count}" # => 2: the space never split a name
```

**`drilling/code/kata-06-quote-spaced-filename/my file.txt`**:

```text
fixture with a spaced name
```

**`drilling/code/kata-06-quote-spaced-filename/notes.txt`**:

```text
plain fixture notes
```

**Output** (`drilling/code/kata-06-quote-spaced-filename/expected/main.stdout.txt`):

```text
file: [my file.txt]
file: [notes.txt]
total: 2
```

### Kata 07: Write an Idempotent Script

(Concepts: co-12.)

Make reruns converge: the starter claims creation without checking, so rerunning crashes. Start from the starter and match the reference that checks state first — create once, report convergence after. Done looks like a created line followed by an already-ready line in one run, which is the whole proof that reruns are safe.

**Before** (`drilling/code/kata-07-idempotent-script/before/starter.sh`):

```bash
# => Kata 7 starter: blind creation fails on the second run.
# => Rerunning crashes instead of converging: not idempotent.
set -euo pipefail # => strict header first, as in every script
echo "created"    # => claims creation without checking state first
```

**After** (`drilling/code/kata-07-idempotent-script/after/solution.sh`):

```bash
# => Kata 7 solution: check state first; reruns converge, never crash.
set -euo pipefail # => strict header first, as in every script
# => WHY check-first: reruns must converge to ready, not crash.
state="$(mktemp -d)"              # => private state dir under /tmp for the demo
cleanup() {                       # => remove the state dir on every exit path
	rm -rf "${state}"                # => the state dir vanishes with the script
}                                 # => closes the state cleaner
trap cleanup EXIT                 # => removal runs on success, error, or signal exits
ensure_ready() {                  # => converge to ready: create once, confirm always
	if [ -f "${state}/ready" ]; then # => state already converged
		echo "already ready"            # => reruns report convergence, not work
	else                             # => first run: the marker is missing
		touch "${state}/ready"          # => converge the state exactly once
		echo "created"                  # => only the first run does the work
	fi                               # => closes the convergence branch
}                                 # => closes the idempotent step
ensure_ready                      # => first call does the work
ensure_ready                      # => second call proves reruns converge safely
```

**Output** (`drilling/code/kata-07-idempotent-script/expected/main.stdout.txt`):

```text
created
already ready
```

### Kata 08: Add Logging with Verbosity

(Concepts: co-13.)

Route every line through one entry point: the starter echoes bare lines with no levels. Start from the starter and match the reference with a `log` function plus a `debug` gate, quiet by default and verbose on request. Done looks like three prefixed lines in verbose mode and two in quiet mode, with no bare echo remaining.

**Before** (`drilling/code/kata-08-logging-and-verbosity/before/starter.sh`):

```bash
# => Kata 8 starter: bare echoes with no levels and no quiet mode.
# => Operators cannot silence it and greps cannot filter it.
set -euo pipefail # => strict header first, as in every script
echo "starting"   # => progress line one, always printed
echo "working"    # => progress line two, always printed
echo "done"       # => progress line three, always printed
```

**After** (`drilling/code/kata-08-logging-and-verbosity/after/solution.sh`):

```bash
# => Kata 8 solution: leveled logging with a verbosity switch.
set -euo pipefail # => strict header first, as in every script
# => WHY levels: quiet by default, verbose on request, errors always.
verbose="yes"                      # => demo default: verbose on so the transcript is full
log() {                            # => one logging entry point for the whole script
	echo "log: $*"                    # => fixed prefix keeps logs greppable
}                                  # => closes the log entry point
debug() {                          # => verbose-only lines for troubleshooting
	if [ "${verbose}" = "yes" ]; then # => quiet mode skips these lines
		log "debug: $*"                  # => debug lines ride the same entry point
	fi                                # => closes the verbosity gate
}                                  # => closes the debug helper
log "starting"                     # => always printed: operators watch for it
debug "details"                    # => printed only when verbose is yes
log "done"                         # => always printed: the closing marker
```

**Output** (`drilling/code/kata-08-logging-and-verbosity/expected/main.stdout.txt`):

```text
log: starting
log: debug: details
log: done
```

## Self-check checklist

- I can write the strict header from memory and explain each flag (co-01).
- I can predict whether a pipeline masks a middle failure (co-01).
- I can parse short flags with `getopts` including one value flag (co-02).
- I can parse long options with a shift loop and `--` handling (co-02).
- I can dispatch subcommands with per-verb functions and usage (co-02).
- I can apply `:-` versus `-` defaults correctly (co-02).
- I can register an EXIT trap that cleans scratch on every path (co-03).
- I can name the failing command from an ERR trap (co-03).
- I can stack multiple handlers behind one EXIT trap (co-03).
- I can explain why a piped loop loses its variables (co-04).
- I can feed a loop by redirection so the accumulator survives (co-04).
- I can compare two command outputs without temp files (co-05).
- I can fan out jobs and join them with deterministic output (co-06).
- I can address jobs by spec without printing PIDs (co-06).
- I can trap INT for cleanup and continue afterwards (co-07).
- I can drain on TERM and disarm EXIT so cleanup runs once (co-07).
- I can quote every expansion and justify each deliberate exception (co-08).
- I can read lines with `IFS= read -r` preserving bytes exactly (co-08).
- I can count, slice, and loop indexed arrays safely (co-09).
- I can tally and dedupe with associative arrays and sorted keys (co-09).
- I can choose heredocs, herestrings, and substitution per input shape (co-10).
- I can exit 0, 1, 2 by contract and test each code (co-11).
- I can write scripts safe to run twice (co-12).
- I can report progress and errors through one logging entry point (co-13).
- I can choose portable versus bash-only syntax deliberately (co-14).
- I can find quoting and syntax slips with mechanical greps (co-15).
- I can pin behaviour with fixture-based golden tests (co-16).
- I can stub a network tool with a same-named function (co-16).
- I can ignore SIGHUP for a detachable section and restore the default (co-07).
- I can join array elements with a scoped separator (co-09).
- I can default missing values without touching the variable (co-02).

That list holds thirty checks; the floor is twenty-four and every concept appears at least once.

## Elaborative interrogation & self-explanation

1. **Why trap EXIT instead of calling cleanup at the end of the script?**
   A trailing call runs only on the happy path; errors, signals, and early exits skip it. The trap fires on every path by construction, so one registration covers success, `exit`, caught errors, and handled signals. Model answer: cleanup is a property of the exit, not of the last line — register it where the resource is created and every path inherits it. Try it: take Example 26, delete the trap line, rerun, and confirm the `cleaned` marker vanishes while the exit code stays 0 — the green run that leaks is exactly what the trap prevents.

2. **Why quote `"$@"` but deliberately leave the handler stack unquoted — and what would break if you swapped them?**
   Quoted `"$@"` preserves argument boundaries across forwarding layers, while the handler stack must split into words to call each handler. Swapped, arguments with spaces corrupt and the stack becomes one unknown command. Model answer: quoting follows intent — preserve boundaries for data, split deliberately for lists you built to be split, and mark every deliberate split so reviewers see choice, not accident. Try it: run Example 33 with the handler stack quoted and watch the fan-out collapse into one unknown-command failure — the counterexample that proves the unquoted split was load-bearing.

3. **Why feed loops by redirection instead of pipes when the loop remembers?**
   Pipes fork each stage into a subshell whose variables die with it; redirection keeps the loop in the current shell. The loop body is identical — only the shell differs. Model answer: choose the connector by lifetime needs (remember means redirect, forget means pipe), and treat a vanished variable after a piped loop as the expected outcome, not a mystery. Try it: rewrite Example 50 with a pipe into the loop and print the total after `done` — the zero you get is the subshell copy dying, and restoring the redirection brings the six back.

4. **Why assert exit codes 2-0-1 with probes instead of eyeballing runs?**
   Eyeballing verifies one run on one machine; probes pin the contract so refactors that remap codes fail loudly in CI instead of silently breaking callers. Model answer: contracts need tests at the boundary they promise — the exit code is the CLI's narrowest API, and three probes pin it forever for the cost of three lines. Try it: swap the 1 and 2 returns in Example 77 and rerun — the probes fail in exactly the way a caller script would have, which is the point of pinning the mapping before the callers depend on it.

5. **Why stage-then-publish instead of writing outputs in place, and when would you not?**
   Staging plus atomic publish means every visible state is whole; in-place writes expose torn states to concurrent consumers. Skip staging only for append-only logs and streaming outputs that are consumed incrementally by design. Model answer: default to whole-or-nothing visibility, and document the streaming exception where consumers genuinely read partials on purpose. Try it: crash Example 31 halfway by inserting `exit 1` between the two stage lines and confirm the output holds only the crash report — no partial result escapes, because publishing happens strictly after the last stage.

6. **Why `LC_ALL=C sort` instead of trusting the machine locale, and what does it cost?**
   Machine locales order case and punctuation unpredictably across systems, breaking goldens and joins; the C locale sorts by byte on every machine. The cost is dictionary-unfriendly order (uppercase first), which documentation must state. Model answer: pin the order where data is compared and leave human-facing messages localized — data determinism first, display comfort second. Try it: run Example 70 under `LC_ALL=tr_TR.UTF-8` if available and compare against the golden order — any divergence you see is the exact CI flake the command-level pin eliminates.
