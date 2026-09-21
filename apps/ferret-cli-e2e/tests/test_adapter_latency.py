"""The adapter latency tool's own rules: what it accepts, what it judges, and how it reports; no process is timed."""

from typing import Any

import pytest

from adapter_latency import (
    HARD_MAX_BUDGET_MS,
    NORMAL_P95_BUDGET_MS,
    WARMUP_CALLS,
    host_facts,
    interleaved,
    judge,
    summarize,
    summary_lines,
)
from hook_wrapper import HookRun
from vendor_payloads import CLAUDE_CODE, OPENCODE

BASELINE_MS = 60.0


def row(harness: str, condition: str, *, p95: float, maximum: float) -> dict[str, float | int | str]:
    return {"harness": harness, "condition": condition, "count": 30, "p50Ms": p95, "p95Ms": p95, "maxMs": maximum}


def ran(seconds: float, *, code: int = 0, stdout: bytes = b"", stderr: bytes = b"") -> HookRun:
    return HookRun(code, stdout, stderr, seconds)


def test_rows_inside_every_budget_raise_no_problem() -> None:
    rows = [
        row(CLAUDE_CODE, "normal", p95=NORMAL_P95_BUDGET_MS, maximum=NORMAL_P95_BUDGET_MS + 20),
        row(CLAUDE_CODE, "kill", p95=1_010, maximum=HARD_MAX_BUDGET_MS),
    ]

    assert judge(rows, BASELINE_MS) == []


def test_a_normal_capture_over_its_p95_budget_is_a_problem() -> None:
    problems = judge([row(CLAUDE_CODE, "normal", p95=NORMAL_P95_BUDGET_MS + 0.1, maximum=200)], BASELINE_MS)

    assert len(problems) == 1
    assert problems[0].startswith("claude_code normal: p95")


def test_only_the_normal_condition_has_a_p95_budget() -> None:
    assert judge([row(CLAUDE_CODE, "busy", p95=900, maximum=950)], BASELINE_MS) == []


def test_any_row_beyond_the_deadline_and_its_tail_is_a_problem() -> None:
    problems = judge([row(CLAUDE_CODE, "timeout", p95=950, maximum=HARD_MAX_BUDGET_MS + 0.1)], BASELINE_MS)

    assert len(problems) == 1
    assert "max" in problems[0]


def test_the_plugin_is_judged_net_of_the_time_node_takes_to_start() -> None:
    slow_only_because_of_node = row(OPENCODE, "normal", p95=NORMAL_P95_BUDGET_MS + BASELINE_MS, maximum=300)
    slow_for_real = row(OPENCODE, "normal", p95=NORMAL_P95_BUDGET_MS + BASELINE_MS + 1, maximum=300)

    assert judge([slow_only_because_of_node], BASELINE_MS) == []
    assert len(judge([slow_for_real], BASELINE_MS)) == 1


def test_a_shell_adapter_is_never_credited_with_the_node_baseline() -> None:
    assert len(judge([row(CLAUDE_CODE, "normal", p95=NORMAL_P95_BUDGET_MS + 1, maximum=300)], BASELINE_MS)) == 1


def test_a_condition_summarizes_to_its_distribution_in_milliseconds() -> None:
    summary = summarize(CLAUDE_CODE, "normal", [ran(0.010), ran(0.030), ran(0.020)])

    assert summary == {
        "harness": CLAUDE_CODE,
        "condition": "normal",
        "count": 3,
        "minMs": 10.0,
        "p50Ms": 20.0,
        "p95Ms": 30.0,
        "maxMs": 30.0,
        "meanMs": 20.0,
    }


@pytest.mark.parametrize(
    "broken",
    [ran(0.01, code=1), ran(0.01, stdout=b"noise"), ran(0.01, stderr=b"noise")],
    ids=["exit", "stdout", "stderr"],
)
def test_a_call_that_broke_the_contract_is_a_failure_of_the_measurement_not_a_sample(broken: HookRun) -> None:
    with pytest.raises(RuntimeError, match="claude_code normal"):
        summarize(CLAUDE_CODE, "normal", [ran(0.01), broken])


def test_the_report_lists_every_row_and_the_verdict() -> None:
    report: dict[str, Any] = {
        "nodeBaseline": {"p50Ms": BASELINE_MS},
        "rows": [row(CLAUDE_CODE, "normal", p95=120.0, maximum=140.0)],
        "problems": ["claude_code busy: max 1300 ms exceeds 1250 ms"],
        "verdict": "over_budget",
    }

    lines = summary_lines(report)

    assert lines[0] == "Node baseline p50=60.0 ms (deducted from the OpenCode rows)"
    assert any(line.startswith("claude_code") and "120.0" in line for line in lines)
    assert lines[-2:] == ["Verdict: over_budget", "  claude_code busy: max 1300 ms exceeds 1250 ms"]


def test_calls_are_taken_round_robin_after_the_unrecorded_warm_up_rounds() -> None:
    order: list[str] = []

    def call(name: str) -> HookRun:
        order.append(name)
        return ran(0.01)

    taken = interleaved({("a", "normal"): lambda: call("a"), ("b", "normal"): lambda: call("b")}, 3)

    assert order == ["a", "b"] * (WARMUP_CALLS + 3)
    assert {key: len(runs) for key, runs in taken.items()} == {("a", "normal"): 3, ("b", "normal"): 3}


def test_the_host_facts_name_the_cpu_count_and_the_three_load_averages() -> None:
    facts = host_facts()

    assert isinstance(facts["cpuCount"], int)
    assert len(facts["loadAverage"]) == 3


def test_the_report_names_the_load_the_host_was_under_when_it_was_recorded() -> None:
    report: dict[str, Any] = {
        "nodeBaseline": {"p50Ms": BASELINE_MS},
        "hostBefore": {"cpuCount": 12, "loadAverage": [1.0, 2.0, 3.0]},
        "hostAfter": {"cpuCount": 12, "loadAverage": [1.5, 2.0, 3.0]},
        "rows": [],
        "problems": [],
        "verdict": "within_budgets",
    }

    assert "Host: 12 CPUs, load [1.0, 2.0, 3.0] before and [1.5, 2.0, 3.0] after" in summary_lines(report)
