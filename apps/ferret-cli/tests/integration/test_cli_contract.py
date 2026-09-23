"""The command-line interface conformance runner, measured against the built artifact as a subprocess.

The manifest in ``tests/fixtures/cli-conformance/assertions.json`` is portable: it states each obligation and the
observation that satisfies it, in prose, without naming a tool. A probe here binds one assertion to a concrete
invocation of this artifact. The obligation is shared; the way to provoke it is not.

Three outcomes, not two. ``UNMEASURED`` exists because an assertion this runner cannot provoke must not be reported as
satisfied: a runner that silently passes what it never exercised is worse than one that admits the gap.

The zero-dependency constraint is preserved. This is ``pytest`` from the existing development group driving the built
zipapp with ``subprocess``, so nothing here enters the shipped artifact.
"""

import json
import os
import signal
import subprocess
import sys
import time
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any, cast

import pytest

import build_zipapp

SOURCE = Path(__file__).resolve().parents[2] / "src"
MANIFEST = Path(__file__).resolve().parents[1] / "fixtures" / "cli-conformance" / "assertions.json"

#: Statuses the convention's closed vocabulary admits below the signal range.
VOCABULARY = (0, 1, 2, 124, 125, 126, 127)


@dataclass(frozen=True)
class Observed:
    """One observation of the artifact at its process boundary."""

    status: int
    stdout: str
    stderr: str


@dataclass(frozen=True)
class Outcome:
    """Passed, Failed with a reason, or Unmeasured with a reason. Never a bare boolean."""

    kind: str
    reason: str = ""


PASSED = Outcome("passed")


def failed(reason: str) -> Outcome:
    return Outcome("failed", reason)


def unmeasured(reason: str) -> Outcome:
    return Outcome("unmeasured", reason)


@dataclass(frozen=True)
class Subject:
    """One program measured against the manifest.

    A subcommand counts as its own subject when the convention classes it differently. ``capture-hook`` is the
    repository's first member of the **harness-callback** class, and the only honest way to show that the class does
    its work is to measure the callback as a subject and let the manifest's ``applies_to`` skip the 49 assertions that
    exclude it. A prose claim that the exemption is handled would prove nothing.
    """

    name: str
    prefix: tuple[str, ...]
    capabilities: frozenset[str]
    classes: frozenset[str]
    known_gaps: Mapping[str, str]


#: This artifact starts no caller-supplied child, so ``starts-child-processes`` is not claimed and the supervisor
#: statuses have no site here. It emits no escape sequence anywhere, so ``colour-output`` is not claimed either and the
#: colour assertions are inapplicable rather than unmeasured -- "does not apply" and "could not be checked" are
#: different states, and only one of them is future work. No command prompts.
TOOL = Subject(
    name="ferret",
    prefix=(),
    capabilities=frozenset(
        {
            "reads-standard-input",
            "machine-readable-output",
            "reads-configuration",
            "has-subcommand-tree",
        }
    ),
    classes=frozenset(),
    known_gaps={},
)

#: Silent, always zero, and keeping its own record of what it lost, which is the whole exemption: the convention
#: grants it on four conditions together, not on silence alone.
CALLBACK = Subject(
    name="ferret capture-hook",
    prefix=("capture-hook",),
    capabilities=frozenset(),
    classes=frozenset({"harness-callback"}),
    known_gaps={},
)

SUBJECTS = (TOOL, CALLBACK)


@pytest.fixture(scope="session")
def artifact(tmp_path_factory: pytest.TempPathFactory) -> Path:
    """The built zipapp, built once for the whole session."""
    target = tmp_path_factory.mktemp("conformance") / "ferret.pyz"
    build_zipapp.build(SOURCE, target)
    return target


@pytest.fixture
def home_root(tmp_path: Path) -> Path:
    """The directory every home a probe needs is created under, so nothing a probe does reaches the real one."""
    return tmp_path


class Runner:
    """Invokes the artifact with a controlled environment and reports what the process boundary showed."""

    def __init__(self, artifact: Path, root: Path) -> None:
        self._artifact = artifact
        self._root = root
        self._home = root / "home"
        self._home.mkdir()
        self._fresh = 0

    def environment(self, **overrides: str) -> dict[str, str]:
        """A minimal environment: nothing the host exports can change what a probe observes."""
        env = {"PATH": "/usr/bin:/bin", "HOME": str(self._home)}
        env.update(overrides)
        return env

    def run(self, *arguments: str, stdin: bytes = b"", **overrides: str) -> Observed:
        completed = subprocess.run(  # the interpreter is the one running these tests; the artifact is this test's own
            [sys.executable, str(self._artifact), *arguments],
            input=stdin,
            capture_output=True,
            check=False,
            env=self.environment(**overrides),
        )
        code = completed.returncode
        return Observed(
            status=code if code >= 0 else 128 - code,
            stdout=completed.stdout.decode(errors="replace"),
            stderr=completed.stderr.decode(errors="replace"),
        )

    def run_fresh(self, *arguments: str) -> Observed:
        """The same invocation against a home that has never been initialized.

        Several assertions are about what a *failing* run looks like, and the cheapest failure this artifact has is an
        uninitialized store. Sharing one home between probes would make each of those depend on whether some earlier
        probe happened to run `init` first, which is an ordering dependency disguised as a measurement.
        """
        self._fresh += 1
        home = self._root / f"fresh-{self._fresh}"
        home.mkdir()
        completed = subprocess.run(  # the interpreter is the one running these tests; the artifact is this test's own
            [sys.executable, str(self._artifact), *arguments],
            input=b"",
            capture_output=True,
            check=False,
            env={"PATH": "/usr/bin:/bin", "HOME": str(home)},
        )
        code = completed.returncode
        return Observed(
            status=code if code >= 0 else 128 - code,
            stdout=completed.stdout.decode(errors="replace"),
            stderr=completed.stderr.decode(errors="replace"),
        )

    def run_with_closed_reader(self, *arguments: str) -> Observed:
        """Provoke a closed pipe by closing the read end before the artifact writes anything.

        The obvious probe -- read one byte, then close -- cannot work on a command whose whole output fits in the
        kernel's pipe buffer: the write succeeds, the process exits 0, and the assertion goes unmeasured for a reason
        about the runner rather than the artifact. Closing first removes the race, because no amount of buffering saves
        a write to a pipe with no reader.
        """
        process = subprocess.Popen(  # the interpreter is the one running these tests; the artifact is this test's own
            [sys.executable, str(self._artifact), *arguments],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=self.environment(),
        )
        assert process.stdout is not None
        assert process.stderr is not None
        process.stdout.close()
        stderr = process.stderr.read().decode(errors="replace")
        code = process.wait()
        return Observed(status=code if code >= 0 else 128 - code, stdout="", stderr=stderr)

    def run_and_interrupt(self, *arguments: str) -> Observed:
        """Interrupt the artifact while it is certainly still running.

        A command that finishes before the signal lands measures the runner's timing, not the artifact, which is why
        this drives `capture`: it blocks reading standard input, and a pipe nobody ever writes to keeps it blocked for
        as long as the probe needs. The write end stays open in this process so the read never sees end-of-file and
        returns early.
        """
        read_fd, write_fd = os.pipe()
        try:
            # the interpreter is the one running these tests; the artifact is this test's own
            process = subprocess.Popen(
                [sys.executable, str(self._artifact), *arguments],
                stdin=read_fd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env=self.environment(),
            )
            os.close(read_fd)
            read_fd = -1
            time.sleep(1.0)
            process.send_signal(signal.SIGINT)
            stdout, stderr = process.communicate(timeout=30)
        finally:
            if read_fd != -1:
                os.close(read_fd)
            os.close(write_fd)
        code = process.returncode
        return Observed(
            status=code if code >= 0 else 128 - code,
            stdout=stdout.decode(errors="replace"),
            stderr=stderr.decode(errors="replace"),
        )

    def initialize(self) -> None:
        """Create the store, so a command that needs one is measured rather than refused for being uninitialized.

        Idempotent: several probes need an initialized store and none of them may depend on running first.
        """
        if not (self._home / ".local" / "share" / "ferret").exists():
            assert self.run("init", "--json").status == 0


def applies(assertion: Mapping[str, object], subject: Subject) -> bool:
    """Whether an assertion binds this subject, decided by the manifest's condition rather than by a local list."""
    applies_to = cast(Mapping[str, Sequence[str]], assertion.get("applies_to") or {})
    required_capabilities = set(applies_to.get("requires_capabilities") or ())
    required_classes = set(applies_to.get("requires_classes") or ())
    excluded_classes = set(applies_to.get("excludes_classes") or ())
    return (
        required_capabilities <= subject.capabilities
        and required_classes <= subject.classes
        and not (excluded_classes & subject.classes)
    )


def probe_exit(runner: Runner, subject: Subject, identifier: str) -> Outcome | None:
    """Bind the exit-status assertions."""
    match identifier:
        case "cli.exit.affirmative-is-zero":
            return expect_status(runner.run(*subject.prefix, "version"), 0)

        case "cli.exit.negative-result-is-one":
            runner.initialize()
            observed = runner.run("events", "list", "--json")
            if observed.status == 1:
                return PASSED
            return failed(f"an empty result exited {observed.status}, not 1")

        case "cli.exit.usage-mistake-is-two":
            observed = runner.run(*subject.prefix, "--no-such-flag")
            return both(expect_status(observed, 2), expect_clean_stdout(observed))

        case "cli.exit.internal-crash-is-two" | "cli.exit.crash-trace-behind-a-switch":
            return unmeasured("no fault-injection point exists at the process boundary")

        case "cli.exit.closed-pipe-is-one-four-one":
            observed = runner.run_with_closed_reader("--help")
            if observed.status == 141 and not observed.stderr:
                return PASSED
            return failed(
                f"expected exit 141 and a silent stderr, observed exit {observed.status}"
                f" and {first_line(observed.stderr)!r}"
            )

        case "cli.exit.interrupt-is-one-three-zero":
            observed = runner.run_and_interrupt("capture")
            if observed.status == 130 and not observed.stderr:
                return PASSED
            return failed(
                f"expected exit 130 and a silent stderr, observed exit {observed.status}"
                f" and {first_line(observed.stderr)!r}"
            )

        case "cli.exit.vocabulary-is-closed":
            return expect_closed_vocabulary(runner)

        case "cli.exit.every-status-is-published":
            observed = runner.run("--help")
            if "exit" in observed.stdout.lower() and any(
                str(status) in observed.stdout for status in (124, 125, 126, 127)
            ):
                return PASSED
            return failed("--help carries no block naming the statuses this artifact returns")

        case _:
            return None


def probe_streams(runner: Runner, subject: Subject, identifier: str) -> Outcome | None:
    """Bind the stream-discipline assertions."""
    match identifier:
        case "cli.streams.payload-on-stdout":
            runner.initialize()
            observed = runner.run("status", "--json")
            if observed.status == 0 and observed.stdout and not observed.stderr:
                return PASSED
            return failed(
                f"expected the payload alone on stdout, observed exit {observed.status},"
                f" {len(observed.stdout)} stdout bytes and {len(observed.stderr)} stderr bytes"
            )

        case "cli.streams.requested-help-on-stdout":
            observed = runner.run(*subject.prefix, "--help")
            return both(
                expect_status(observed, 0),
                PASSED if observed.stdout and not observed.stderr else failed("help did not reach stdout alone"),
            )

        case "cli.streams.requested-version-on-stdout":
            observed = runner.run("--version")
            return both(
                expect_status(observed, 0),
                PASSED if observed.stdout.startswith("ferret ") else failed("stdout did not name the tool and version"),
            )

        case "cli.streams.usage-mistake-leaves-stdout-clean":
            observed = runner.run(*subject.prefix, "--no-such-flag")
            return both(
                both(expect_status(observed, 2), expect_clean_stdout(observed)),
                PASSED if observed.stderr else failed("no diagnostic reached stderr"),
            )

        case "cli.streams.help-suppresses-normal-function":
            runner.initialize()
            observed = runner.run("status", "--help")
            if observed.status == 0 and "usage:" in observed.stdout and "Data home" not in observed.stdout:
                return PASSED
            return failed("--help alongside a command did not suppress the command's own work")

        case "cli.streams.error-body-on-stderr":
            observed = runner.run_fresh("status", "--output", "json")
            if observed.status == 0:
                return failed("the run intended to fail succeeded, so nothing was measured")
            if observed.stdout:
                return failed(f"expected empty stdout on failure, observed {len(observed.stdout)} bytes")
            try:
                json.loads(observed.stderr)
            except json.JSONDecodeError as error:
                return failed(f"stderr did not parse as the declared format: {error}")
            return PASSED

        case "cli.streams.diagnostics-on-stderr":
            return unmeasured("no command emits a warning or a progress indicator, so there is nothing to place")

        case "cli.streams.incremental-flush":
            return unmeasured(
                "the store is empty in a fresh home, so an export has no record whose arrival time could be observed"
            )

        case _:
            return None


def probe_input_and_output(runner: Runner, subject: Subject, identifier: str) -> Outcome | None:
    """Bind the standard-input and machine-readable-output assertions."""
    match identifier:
        case "cli.stdin.not-read-unless-selected":
            # stdin is a closed pipe here. A command that read it regardless would block or fail rather than answer.
            observed = runner.run("version")
            return expect_status(observed, 0)

        case "cli.stdin.lone-dash-selects-stdin":
            return unmeasured(
                "this artifact reads stdin by command rather than by operand: capture always reads it and no other"
                " command ever does, so there is no file operand for a lone dash to stand in for"
            )

        case "cli.stdin.read-failure-is-not-empty-input":
            runner.initialize()
            observed = runner.run("capture", "--json", stdin=b"")
            if observed.status == 0:
                return failed("an empty stdin was accepted as valid input")
            return PASSED

        case "cli.output.mode-is-explicit":
            runner.initialize()
            observed = runner.run("status")
            if observed.stdout.lstrip().startswith("{"):
                return failed("machine-readable output was emitted with no flag asking for it")
            return PASSED

        case "cli.output.carries-a-schema-version":
            runner.initialize()
            observed = runner.run("status", "--output", "json")
            document = json.loads(observed.stdout)
            if "schemaVersion" in document:
                return PASSED
            return failed("the document carries no schemaVersion field")

        case "cli.output.error-body-required-fields":
            observed = runner.run_fresh("status", "--output", "json")
            document = json.loads(observed.stderr)
            missing = [name for name in ("schemaVersion", "error") if name not in document]
            if missing:
                return failed(f"the error body is missing {', '.join(missing)}")
            if "code" not in document["error"]:
                return failed("the error body carries no error.code")
            if "message" not in document["error"]:
                return failed("the error body carries no error.message")
            return PASSED

        case "cli.output.error-codes-are-namespaced":
            observed = runner.run_fresh("status", "--output", "json")
            code = json.loads(observed.stderr)["error"]["code"]
            if code.count(".") >= 2 and code.startswith("ferret."):
                return PASSED
            return failed(f"error code {code!r} is not of the form tool.area.reason")

        case "cli.output.error-code-vocabulary-is-closed":
            return unmeasured(
                "the vocabulary is closed in domain/errors.py and covered by that project's own unit adapter; proving"
                " closure from outside would need every documented failure path provoked, which is not this runner's"
                " boundary"
            )

        case "cli.output.machine-readable-is-escape-free":
            runner.initialize()
            observed = runner.run("status", "--output", "json")
            if "\x1b" in observed.stdout:
                return failed("the machine-readable document carries escape bytes")
            return PASSED

        case _:
            return None


def probe_arguments_and_configuration(runner: Runner, subject: Subject, identifier: str) -> Outcome | None:
    """Bind the argument-syntax, configuration, and diagnostic assertions."""
    match identifier:
        case "cli.args.double-dash-ends-options":
            observed = runner.run("--", "version")
            if observed.status == 0:
                return PASSED
            return failed(f"an operand after -- was not accepted: exit {observed.status}")

        case "cli.args.option-and-value-may-be-separate":
            runner.initialize()
            observed = runner.run("status", "--output", "json")
            if observed.status == 0:
                return PASSED
            return failed(f"an option and its value as two arguments were refused: exit {observed.status}")

        case "cli.args.short-help-on-every-subcommand":
            observed = runner.run("status", "-h")
            return both(
                expect_status(observed, 0),
                PASSED if "usage:" in observed.stdout else failed("no subcommand usage reached stdout"),
            )

        case "cli.args.bare-invocation-is-a-usage-mistake":
            observed = runner.run(*subject.prefix)
            return both(
                expect_status(observed, 2),
                PASSED
                if not observed.stdout and observed.stderr
                else failed(
                    f"expected the diagnostic on stderr and nothing on stdout, observed"
                    f" {len(observed.stdout)} and {len(observed.stderr)} bytes"
                ),
            )

        case "cli.args.help-subcommand-when-a-tree-exists":
            observed = runner.run("help")
            return both(
                expect_status(observed, 0),
                PASSED if observed.stdout else failed("no usage text reached stdout"),
            )

        case "cli.config.xdg-defaults-when-unset":
            runner.initialize()
            observed = runner.run("status", "--output", "json")
            reported = Path(json.loads(observed.stdout)["dataHome"])
            wanted = runner.environment()["HOME"]
            if reported == Path(wanted) / ".local" / "share" / "ferret":
                return PASSED
            return failed(f"the data home is {reported}, not $XDG_DATA_HOME defaulting to $HOME/.local/share/ferret")

        case "cli.config.xdg-empty-falls-back":
            runner.initialize()
            observed = runner.run("status", "--output", "json", XDG_DATA_HOME="")
            reported = Path(json.loads(observed.stdout)["dataHome"])
            wanted = runner.environment()["HOME"]
            if reported == Path(wanted) / ".local" / "share" / "ferret":
                return PASSED
            return failed(f"an empty XDG_DATA_HOME resolved to {reported} rather than the documented default")

        case "cli.config.precedence-is-published":
            return unmeasured("the claim is about this project's documentation, not about its process boundary")

        case "cli.diagnostics.name-the-tool-first":
            observed = runner.run("--no-such-flag")
            if observed.stderr.startswith("ferret:"):
                return PASSED
            return failed(f"the diagnostic does not name the tool first: {first_line(observed.stderr)!r}")

        case "cli.diagnostics.carry-no-secret":
            return unmeasured("no failure path in this artifact has access to a credential")

        case _:
            return None


def probe_exemption(runner: Runner, subject: Subject, identifier: str) -> Outcome | None:
    """Bind the harness-callback assertions, which apply only to a subject claiming that class."""
    match identifier:
        case "cli.exempt.harness-callback-is-silent":
            # Four failure paths: a missing argument, an unregistered harness and event, malformed input, and an
            # unusable store. Silence on the easy path proves nothing; the exemption is about the failures.
            failures: list[str] = []
            for arguments, stdin in (
                ((), b""),
                (("--harness", "nope", "--event", "nope"), b"{}"),
                (("--harness", "claude_code", "--event", "session-start"), b'{"bad"'),
                (("--harness", "claude_code", "--event", "session-start"), b"{}"),
            ):
                observed = runner.run(*subject.prefix, *arguments, stdin=stdin)
                if observed.status != 0 or observed.stdout or observed.stderr:
                    failures.append(
                        f"`{' '.join((*subject.prefix, *arguments))}` exited {observed.status}"
                        f" with {len(observed.stdout)} stdout and {len(observed.stderr)} stderr bytes"
                    )
            if failures:
                return failed("; ".join(failures))
            return PASSED

        case "cli.exempt.harness-callback-records-its-failures":
            runner.initialize()
            before = runner.run("status", "--output", "json")
            runner.run(*subject.prefix, "--harness", "claude_code", "--event", "session-start", stdin=b'{"bad"')
            after = runner.run("status", "--output", "json")
            if before.stdout == after.stdout:
                return failed(
                    "a malformed payload left no trace anywhere a maintainer can reach: the store is unchanged and"
                    " neither stream carried anything"
                )
            return PASSED

        case _:
            return None


AREAS: tuple[Callable[[Runner, Subject, str], Outcome | None], ...] = (
    probe_exit,
    probe_streams,
    probe_input_and_output,
    probe_arguments_and_configuration,
    probe_exemption,
)


def probe(runner: Runner, subject: Subject, identifier: str) -> Outcome | None:
    """Bind one assertion identifier to a probe, or report it unbound.

    The areas are separate functions rather than one dispatch: a single function covering every assertion outgrows any
    reasonable complexity ceiling, and the areas are how the convention itself is organized.
    """
    for area in AREAS:
        outcome = area(runner, subject, identifier)
        if outcome is not None:
            return outcome
    return None


def expect_status(observed: Observed, wanted: int) -> Outcome:
    if observed.status == wanted:
        return PASSED
    return failed(f"expected exit {wanted}, observed {observed.status}")


def expect_clean_stdout(observed: Observed) -> Outcome:
    if not observed.stdout:
        return PASSED
    return failed(f"expected empty stdout, observed {len(observed.stdout)} bytes beginning {observed.stdout[:60]!r}")


def expect_closed_vocabulary(runner: Runner) -> Outcome:
    """Every documented failure path in turn, checked against the closed vocabulary."""
    paths: Sequence[tuple[str, ...]] = (
        ("--no-such-flag",),
        ("status",),
        ("status", "--output", "json"),
        ("events", "list"),
        ("capture",),
        ("maintenance",),
    )
    outside = [
        f"`{' '.join(arguments)}` exits {observed.status}"
        for arguments in paths
        if (observed := runner.run_fresh(*arguments)).status not in VOCABULARY and observed.status < 128
    ]
    if outside:
        return failed("; ".join(outside))
    return PASSED


def both(first: Outcome, second: Outcome) -> Outcome:
    """Two observations of one assertion, reported as the worse of the pair."""
    for kind in ("failed", "unmeasured"):
        reasons = [outcome.reason for outcome in (first, second) if outcome.kind == kind]
        if reasons:
            return Outcome(kind, "; ".join(reasons))
    return PASSED


def first_line(text: str) -> str:
    """One line, so a panic or a traceback names itself without pasting itself into the report."""
    return text.strip().split("\n", 1)[0]


def load_assertions() -> list[Mapping[str, Any]]:
    manifest = cast(Mapping[str, Any], json.loads(MANIFEST.read_text(encoding="utf-8")))
    assertions = cast(list[Mapping[str, Any]], manifest["assertions"])
    assert assertions, "the manifest is empty"
    return assertions


@pytest.mark.parametrize("subject", SUBJECTS, ids=lambda subject: subject.name)
def test_the_interface_contract_holds_at_the_process_boundary(
    artifact: Path,
    home_root: Path,
    subject: Subject,
    capsys: pytest.CaptureFixture[str],
) -> None:
    runner = Runner(artifact, home_root)
    tally: dict[str, list[str]] = {"passed": [], "failed": [], "unmeasured": [], "unbound": []}
    skipped_unverified = 0
    skipped_inapplicable = 0

    for assertion in load_assertions():
        identifier = assertion["id"]
        assert isinstance(identifier, str)

        # The corpus's one hard rule: nothing but `verified` may gate.
        if assertion.get("status") != "verified":
            skipped_unverified += 1
            continue
        if not applies(assertion, subject):
            skipped_inapplicable += 1
            continue

        outcome = probe(runner, subject, identifier)
        if outcome is None:
            tally["unbound"].append(identifier)
        elif outcome.kind == "passed":
            tally["passed"].append(identifier)
        else:
            tally[outcome.kind].append(f"{identifier}: {outcome.reason}")

    # Printed on every run rather than only on failure: the useful question during a port is how much of the contract
    # is actually being exercised.
    report = [
        f"cli-conformance [{subject.name}]: {len(tally['passed'])} pass, {len(tally['failed'])} fail,"
        f" {len(tally['unmeasured'])} unmeasured, {len(tally['unbound'])} unbound;"
        f" skipped {skipped_unverified} unverified and {skipped_inapplicable} inapplicable",
        *(f"  unmeasured  {entry}" for entry in tally["unmeasured"]),
        *(f"  unbound     {entry}" for entry in tally["unbound"]),
        *(f"  known gap   {identifier}: {reason}" for identifier, reason in sorted(subject.known_gaps.items())),
    ]
    with capsys.disabled():
        print("\n".join(("", *report)))

    failed_identifiers = {entry.split(":", 1)[0] for entry in tally["failed"]}
    known = set(subject.known_gaps)

    unexpected = sorted(entry for entry in tally["failed"] if entry.split(":", 1)[0] not in known)
    assert not unexpected, "assertions fail that are not recorded as known gaps:\n" + "\n".join(unexpected)

    repaired = sorted(known - failed_identifiers)
    assert not repaired, "known gaps now pass and must be removed from known_gaps:\n" + "\n".join(repaired)
