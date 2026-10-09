"""Capstone: job scheduler -- priority + dependency task ordering.

Ingests tasks shaped {id, priority, deps} and emits a valid run order: every
task's dependencies run before it, and among tasks with no remaining
dependencies, the higher-priority task always runs first. Combines a heap
(priority), dicts (lookup + in-degree tracking), a queue/BFS-style traversal
(dependency relaxation via Kahn's algorithm), and cycle detection in one
runnable program.

Big-O per phase (n = number of tasks, e = number of dependency edges):

- ``parse_tasks``: O(n + e) -- one pass over tasks and their dependency IDs.
- ``build_graph``: O(n + e) -- one pass initializing every task's adjacency
  list and in-degree counter, plus one pass per dependency edge to link
  each task to the tasks that depend on it.
- ``schedule`` (Kahn's algorithm, heap-ordered instead of plain-queue-ordered):
  O((n + e) log n) -- every schedulable task is pushed and popped from the priority
  heap at most once (O(log n) per push/pop), and every dependency edge is
  relaxed at most once, when its source task is emitted.
- Cycle detection: the length check costs O(1). If it finds a cycle, collecting
  and sorting the tasks with positive in-degree costs O(n log n) for a
  deterministic diagnostic; those tasks are cyclic or depend on a cycle.
"""

from __future__ import annotations

import heapq
import json
from dataclasses import dataclass
from pathlib import Path


class SchedulerCycleError(Exception):
    """Raised when the task graph contains a dependency cycle."""


@dataclass(frozen=True)
class Task:
    """One schedulable unit of work."""

    id: str
    priority: int  # higher number = more urgent; breaks ties among ready tasks
    deps: tuple[str, ...]  # ids of tasks that must complete before this one can run


def parse_tasks(raw_tasks: list[dict[str, object]]) -> dict[str, Task]:
    """Build an id -> Task lookup from raw dicts -- O(n + e)."""
    tasks: dict[str, Task] = {}  # => the id -> Task map every later phase queries by id
    for raw in raw_tasks:  # => one pass over the input, O(n)
        task_id = str(raw["id"])
        if task_id in tasks:  # => reject collisions before they overwrite a task
            raise ValueError(f"duplicate task id: {task_id!r}")
        priority = int(raw["priority"])  # type: ignore[arg-type]
        deps = tuple(str(d) for d in raw.get("deps", []))  # type: ignore[union-attr]
        tasks[task_id] = Task(id=task_id, priority=priority, deps=deps)
    return tasks


def build_graph(tasks: dict[str, Task]) -> tuple[dict[str, list[str]], dict[str, int]]:
    """Build the adjacency map (dep -> tasks depending on it) and each task's
    in-degree (its unresolved dependency count) -- O(n + e)."""
    adjacency: dict[str, list[str]] = {tid: [] for tid in tasks}  # => O(n) init
    in_degree: dict[str, int] = {tid: 0 for tid in tasks}  # => O(n) init
    for task in tasks.values():  # => O(n) outer pass
        for dep in task.deps:  # => O(e) total across all tasks combined
            if dep not in tasks:  # => O(1) average dict membership check
                raise KeyError(f"{task.id!r} depends on unknown task {dep!r}")
            adjacency[dep].append(task.id)  # => dep unlocks task.id once dep finishes
            in_degree[task.id] += 1  # => task.id has one more unresolved dependency
    return adjacency, in_degree


def schedule(tasks: dict[str, Task]) -> list[str]:
    """Kahn's topological sort, with a max-priority heap tie-break -- O((n + e) log n).

    heapq is a MIN-heap, so pushing (-priority, id) makes the heap always pop
    the HIGHEST-priority ready task first, exactly like Example 41's negation trick.
    """
    adjacency, in_degree = build_graph(tasks)  # => O(n + e)
    ready: list[tuple[int, str]] = [
        (-tasks[tid].priority, tid) for tid in tasks if in_degree[tid] == 0
    ]  # => seeds the heap with every task that has NO dependencies at all
    heapq.heapify(
        ready
    )  # => O(k) where k = len(ready), turns the list into a valid heap

    order: list[str] = []  # => the emitted run order, respecting deps and priority ties
    while (
        ready
    ):  # => drains the heap -- each task pushed/popped at most once, O(log n) each
        _, task_id = heapq.heappop(ready)  # => always the highest-priority ready task
        order.append(task_id)
        for dependent in adjacency[
            task_id
        ]:  # => relax every edge OUT of task_id, O(e) total
            in_degree[dependent] -= 1  # => task_id no longer blocks dependent
            if (
                in_degree[dependent] == 0
            ):  # => dependent has NO unresolved deps left -- ready
                heapq.heappush(ready, (-tasks[dependent].priority, dependent))

    if len(order) != len(
        tasks
    ):  # => O(1): fewer emissions than tasks means a cycle exists
        stuck = sorted(
            tid for tid, degree in in_degree.items() if degree > 0
        )  # => O(n log n) worst case; all and only blocked tasks remain
        raise SchedulerCycleError(
            f"dependency cycle detected among: {', '.join(stuck)}"
        )
    return order  # => a complete, valid run order -- every dep precedes its dependents


def load_tasks(path: Path) -> dict[str, Task]:
    """Read a JSON file of raw task dicts and parse it into Task objects."""
    with path.open() as f:  # => `with` guarantees the file handle closes
        raw_tasks = json.load(f)  # => parses the whole file as one JSON value
    return parse_tasks(raw_tasks)


def main() -> None:
    """CLI entry point: schedule the sample tasks.json next to this file."""
    tasks_path = (
        Path(__file__).parent / "tasks.json"
    )  # => resolves relative to THIS file
    tasks = load_tasks(tasks_path)
    order = schedule(tasks)
    print(" -> ".join(order))  # => prints the run order as an arrow-joined chain


if (
    __name__ == "__main__"
):  # => only runs main() when invoked directly, not when imported
    main()
