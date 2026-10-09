"""pytest coverage for ordering, duplicate IDs, and cycle diagnostics."""

import pytest

from scheduler import SchedulerCycleError, parse_tasks, schedule


def test_acyclic_order_respects_dependencies() -> None:
    """Every dependency must be emitted strictly before every task that depends on it."""
    raw_tasks: list[dict[str, object]] = [
        {"id": "compile", "priority": 3, "deps": []},
        {"id": "lint", "priority": 5, "deps": []},
        {"id": "unit_test", "priority": 4, "deps": ["compile"]},
        {"id": "integration_test", "priority": 2, "deps": ["compile", "lint"]},
        {"id": "package", "priority": 1, "deps": ["unit_test", "integration_test"]},
        {"id": "deploy", "priority": 1, "deps": ["package"]},
    ]
    tasks = parse_tasks(raw_tasks)
    order = schedule(tasks)

    assert len(order) == len(tasks)  # every task appears exactly once
    assert set(order) == set(tasks)  # no task is missing or duplicated
    positions = {task_id: index for index, task_id in enumerate(order)}
    for task in tasks.values():
        for dep in task.deps:
            assert positions[dep] < positions[task.id]  # dep runs strictly before task


def test_acyclic_order_breaks_ties_by_priority() -> None:
    """Among tasks with no remaining dependencies, the higher-priority task runs first."""
    raw_tasks: list[dict[str, object]] = [
        {"id": "compile", "priority": 3, "deps": []},
        {"id": "lint", "priority": 5, "deps": []},
    ]
    tasks = parse_tasks(raw_tasks)
    order = schedule(tasks)

    # Both tasks are ready at the same time (no deps); priority 5 beats priority 3.
    assert order == ["lint", "compile"]


def test_cyclic_graph_raises_scheduler_cycle_error() -> None:
    """A dependency cycle must raise a clear, dedicated error, not silently drop tasks."""
    raw_tasks: list[dict[str, object]] = [
        {"id": "a", "priority": 1, "deps": ["c"]},
        {"id": "b", "priority": 1, "deps": ["a"]},
        {"id": "c", "priority": 1, "deps": ["b"]},  # a -> b -> c -> a: a cycle
    ]
    tasks = parse_tasks(raw_tasks)

    with pytest.raises(SchedulerCycleError):
        schedule(tasks)


def test_cyclic_graph_error_names_the_stuck_tasks() -> None:
    """The raised error message names every task caught in (or blocked by) the cycle."""
    raw_tasks: list[dict[str, object]] = [
        {"id": "a", "priority": 1, "deps": ["b"]},
        {"id": "b", "priority": 1, "deps": ["a"]},
        {"id": "independent", "priority": 1, "deps": []},  # not part of the cycle
    ]
    tasks = parse_tasks(raw_tasks)

    with pytest.raises(SchedulerCycleError) as excinfo:
        schedule(tasks)
    assert "a" in str(excinfo.value)
    assert "b" in str(excinfo.value)
    assert "independent" not in str(excinfo.value)  # the healthy task is not implicated


def test_duplicate_task_id_is_rejected_before_scheduling() -> None:
    """Duplicate IDs must never silently replace an earlier task."""
    raw_tasks: list[dict[str, object]] = [
        {"id": "compile", "priority": 5, "deps": []},
        {"id": "compile", "priority": 1, "deps": []},
    ]

    with pytest.raises(ValueError, match="duplicate task id: 'compile'"):
        parse_tasks(raw_tasks)


def test_cycle_diagnostic_names_only_stuck_tasks_in_sorted_order() -> None:
    """Cycle diagnostics stay deterministic even with many completed tasks."""
    raw_tasks: list[dict[str, object]] = [
        {"id": f"free-{index}", "priority": index, "deps": []} for index in range(200)
    ] + [
        {"id": "z-cycle", "priority": 0, "deps": ["a-cycle"]},
        {"id": "a-cycle", "priority": 0, "deps": ["z-cycle"]},
    ]

    with pytest.raises(SchedulerCycleError) as excinfo:
        schedule(parse_tasks(raw_tasks))
    assert str(excinfo.value) == "dependency cycle detected among: a-cycle, z-cycle"
