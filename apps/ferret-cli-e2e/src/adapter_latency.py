"""Measure how long each harness adapter takes to return, per condition, and judge the result against its budgets.

Every sample is one whole adapter call as a harness makes it: the shared wrapper for Claude Code and Codex, and the
OpenCode plugin under Node, against the built artifact in an isolated HOME. The conditions are the ones an adapter must
survive: a normal capture, a missing ``ferret``, an invalid payload, a store held by a concurrent writer, a child that
hangs, and a child that ignores TERM. Calls are taken round-robin across every harness and condition, so a burst of
load on the host is shared by every row instead of landing on one. The plugin's rows are judged net of the time Node
itself takes to start, because OpenCode is already running and a hook call never waits for the child it starts.
"""

import argparse
import json
import os
import sqlite3
import sys
import tempfile
from collections.abc import Callable, Mapping, Sequence
from contextlib import closing
from pathlib import Path
from typing import Any

from adapter_cases import HARNESSES, INVALID, VALID
from hook_bench import Bench
from hook_wrapper import DEADLINE_SECONDS, TAIL_SECONDS, HookRun, run_plugin, stand_in
from storage_benchmark import distribution
from vendor_payloads import OPENCODE, WORKSPACE

NORMAL_P95_BUDGET_MS = 150.0
HARD_MAX_BUDGET_MS = (DEADLINE_SECONDS + TAIL_SECONDS) * 1000
WARMUP_CALLS = 2
DEFAULT_SAMPLES = 100
DEFAULT_SLOW_SAMPLES = 8
BUILT_ARTIFACT = Path(__file__).resolve().parents[2] / "ferret-cli" / "dist" / "ferret.pyz"
FAST = ("normal", "missing", "invalid")
BOUNDED = ("timeout", "kill")

type Row = dict[str, Any]
type Key = tuple[str, str]
type Call = Callable[[], HookRun]


def milliseconds(ran: HookRun) -> float:
    return ran.elapsed_seconds * 1000


def judge(rows: Sequence[Row], baseline_ms: float) -> list[str]:
    """Every budget the measured rows break; an empty list means the adapters are as fast and as bounded as promised.

    The normal-capture 95th percentile must be within its budget, and no row may take longer than the deadline plus the
    reap tail. The plugin's normal row is judged net of the Node start-up the driver adds around it.
    """
    problems: list[str] = []
    for row in rows:
        label = f"{row['harness']} {row['condition']}"
        overhead = baseline_ms if row["harness"] == OPENCODE else 0.0
        if row["condition"] == "normal" and row["p95Ms"] - overhead > NORMAL_P95_BUDGET_MS:
            problems.append(f"{label}: p95 {row['p95Ms']} ms (net {row['p95Ms'] - overhead:.1f}) exceeds the budget")
        if row["maxMs"] > HARD_MAX_BUDGET_MS:
            problems.append(f"{label}: max {row['maxMs']} ms exceeds {HARD_MAX_BUDGET_MS:.0f} ms")
    return problems


def summarize(harness: str, condition: str, runs: Sequence[HookRun]) -> Row:
    """One row: the distribution of an adapter's return times, after checking that every call kept its contract."""
    for ran in runs:
        if (ran.code, ran.stdout, ran.stderr) != (0, b"", b""):
            raise RuntimeError(f"{harness} {condition}: exit {ran.code} with output {ran.stdout!r} {ran.stderr!r}")
    return {"harness": harness, "condition": condition, **distribution([milliseconds(ran) for ran in runs])}


def interleaved(calls: Mapping[Key, Call], samples: int) -> dict[Key, list[HookRun]]:
    """Unrecorded warm-up rounds, then ``samples`` recorded ones, each round calling every entry once in order."""
    for _ in range(WARMUP_CALLS):
        for call in calls.values():
            call()
    taken: dict[Key, list[HookRun]] = {key: [] for key in calls}
    for _ in range(samples):
        for key, call in calls.items():
            taken[key].append(call())
    return taken


def calls_for(bench: Bench, harness: str) -> dict[str, Call]:
    """The call each condition makes for one harness: its valid payload, or the one fault the condition names."""
    fixture = VALID[harness]
    hang = stand_in(bench.directory, "hang")
    stubborn = stand_in(bench.directory, "stubborn")

    def valid(binary: Path | str | None = "default") -> HookRun:
        return bench.forward(harness, fixture.event, fixture.document, binary=binary)

    return {
        "normal": valid,
        "missing": lambda: valid(None),
        "invalid": lambda: bench.forward(harness, fixture.event, INVALID[harness]),
        "busy": valid,
        "timeout": lambda: valid(hang),
        "kill": lambda: valid(stubborn),
    }


def host_facts() -> dict[str, Any]:
    """The load the machine was under, so a slow reading can be told from a slow adapter."""
    return {"cpuCount": os.cpu_count(), "loadAverage": [round(value, 2) for value in os.getloadavg()]}


def measure(artifact: Path, *, samples: int, slow_samples: int) -> dict[str, Any]:
    """Time every condition for every harness on one machine and report the rows with the verdict."""
    before = host_facts()
    with tempfile.TemporaryDirectory(prefix="ferret-latency-") as scratch:
        directory = Path(scratch)
        home = directory / "home"
        home.mkdir(mode=0o700)
        bench = Bench.create(artifact, home, directory)
        plans = {harness: calls_for(bench, harness) for harness in HARNESSES}

        def selected(conditions: Sequence[str]) -> dict[Key, Call]:
            return {(harness, name): plans[harness][name] for harness in HARNESSES for name in conditions}

        node_only = [run_plugin([], home=home, binary=bench.ferret, directory=Path(WORKSPACE)) for _ in range(samples)]
        runs = interleaved(selected(FAST), samples)
        with closing(sqlite3.connect(bench.database, autocommit=True)) as holder:
            holder.execute("BEGIN IMMEDIATE")
            try:
                runs |= interleaved(selected(["busy"]), slow_samples)
            finally:
                holder.execute("ROLLBACK")
        runs |= interleaved(selected(BOUNDED), slow_samples)
    baseline = distribution([milliseconds(ran) for ran in node_only])
    rows = [summarize(harness, name, runs[(harness, name)]) for harness in HARNESSES for name in plans[harness]]
    problems = judge(rows, baseline["p50Ms"])
    return {
        "budgets": {"normalP95Ms": NORMAL_P95_BUDGET_MS, "hardMaxMs": HARD_MAX_BUDGET_MS},
        "warmupCalls": WARMUP_CALLS,
        "hostBefore": before,
        "hostAfter": host_facts(),
        "nodeBaseline": baseline,
        "rows": rows,
        "problems": problems,
        "verdict": "within_budgets" if not problems else "over_budget",
    }


def summary_lines(report: dict[str, Any]) -> list[str]:
    lines = [f"Node baseline p50={report['nodeBaseline']['p50Ms']} ms (deducted from the OpenCode rows)"]
    if "hostBefore" in report:
        lines.append(
            f"Host: {report['hostBefore']['cpuCount']} CPUs, load {report['hostBefore']['loadAverage']}"
            f" before and {report['hostAfter']['loadAverage']} after"
        )
    lines.append(f"{'harness':<12}{'condition':<10}{'n':>4}{'p50':>9}{'p95':>9}{'max':>9}")
    lines.extend(
        f"{row['harness']:<12}{row['condition']:<10}{row['count']:>4}{row['p50Ms']:>9}{row['p95Ms']:>9}{row['maxMs']:>9}"
        for row in report["rows"]
    )
    lines.append(f"Verdict: {report['verdict']}")
    lines.extend(f"  {problem}" for problem in report["problems"])
    return lines


def parse(arguments: Sequence[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog="adapter_latency.py", description="Time the FERRET harness adapters.")
    parser.add_argument("--artifact", type=Path, default=BUILT_ARTIFACT, help="the built ferret.pyz to measure")
    parser.add_argument("--output", type=Path, required=True, help="where to write the aggregate JSON result")
    parser.add_argument("--samples", type=int, default=DEFAULT_SAMPLES, help="calls per fast condition")
    parser.add_argument(
        "--slow-samples", type=int, default=DEFAULT_SLOW_SAMPLES, help="calls per bounded-wait condition"
    )
    options = parser.parse_args(arguments)
    if options.samples < 2 or options.slow_samples < 1:
        parser.error("--samples must be at least 2 and --slow-samples at least 1")
    if not options.artifact.is_file():
        parser.error(f"no built artifact at {options.artifact}; run the ferret-cli build target first")
    return options


def main(arguments: Sequence[str] | None = None) -> int:
    options = parse(arguments)
    report = measure(options.artifact.resolve(), samples=options.samples, slow_samples=options.slow_samples)
    options.output.parent.mkdir(parents=True, exist_ok=True)
    options.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    sys.stdout.write("\n".join(summary_lines(report)) + "\n")
    return 0 if report["verdict"] == "within_budgets" else 1


if __name__ == "__main__":
    sys.exit(main())
