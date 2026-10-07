"""Nominal timers and ordering are observed on the actual shell/plugin subjects with controlled host boundaries."""

from pathlib import Path

import pytest

from support.controlled_timers import controlled_plugin, controlled_wrapper
from support.hook_payloads import opencode_call


@pytest.mark.parametrize("early_exit", [False, True], ids=["late-expiry-then-kill", "early-child-exit"])
def test_real_shell_requests_full_grace_and_retires_owned_timers(tmp_path: Path, early_exit: bool) -> None:
    proof = controlled_wrapper(
        tmp_path, "claude_code", "tool.completed", b"untouched\x00payload", early_exit=early_exit
    )
    assert proof.requests_ms == ((900,) if early_exit else (900, 100))
    assert proof.signals == (() if early_exit else ("TERM", "KILL"))
    assert proof.argv == ("capture-hook", "--harness", "claude_code", "--event", "tool.completed")
    assert proof.stdin == b"untouched\x00payload"


@pytest.mark.parametrize(
    ("completion", "late_delivery"),
    [("", False), ("", True), ("exit", False), ("error", False)],
    ids=["nominal-clock", "late-delivery", "early-exit", "spawn-error"],
)
def test_real_plugin_requests_nominal_timers_and_cancels_both(
    tmp_path: Path, completion: str, late_delivery: bool
) -> None:
    call = opencode_call("tool.execute.before")
    proof = controlled_plugin(tmp_path, call, completion=completion, late_delivery=late_delivery)
    assert proof.requests_ms == (900, 1000)
    assert proof.argv == ("capture-hook", "--harness", "opencode", "--event", "tool.started")
