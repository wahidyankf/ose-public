---
title: "Overview"
date: 2026-07-14T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [4 · Just Enough Python](../just-enough-python/learning/overview.md) -- every
  example in this topic is Python, and this topic assumes you can already read and write functions,
  lists, dicts, and loops the way that primer taught them.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.10 or newer** (`python3 --version`)
  with `pytest` installed in a `venv` for the capstone's test suite.
- **Assumed knowledge**: basic Python syntax from Just Enough Python. No prior algorithms background
  is required -- this topic is where that background starts.

## Why this exists -- the big idea

This is topic 7 of the journey, sitting between the language fundamentals Pass 1 has already built and
the object-oriented design the very next topic introduces. The problem before the solution: the same
task can run instantly or crawl depending on how you store the data -- choosing the wrong structure is
a bug you only feel at scale, long after the code first "worked." The one idea worth keeping if you
forget everything else: **pick the structure that makes the common operation cheap** -- the
data-structure choice is the real decision, and the algorithm you reach for often follows directly
from it.

**Cross-cutting big idea**: `abstraction-and-its-cost` -- every structure in this topic trades one
operation's cost for another. A hash map (`dict`) buys O(1) average key lookup and preserves insertion
order, but it does not keep keys sorted; a plain list buys O(1) indexing and charges you O(n) search;
a min-heap buys O(1) access to the smallest element and O(log n) insertion/removal, but finding an
arbitrary item still takes O(n). Nothing here is free --
the skill this topic teaches is knowing exactly which cost you are choosing to pay, and why.

This topic covers the **usable slice**: the structures and algorithms a working engineer reaches for
daily -- arrays, stacks, queues, hash maps, trees, heaps, graphs, searching, sorting, recursion, and
memoization -- verified against Python 3.14.x and CLRS 4th edition. Deeper paradigms (formal
amortized/Θ/Ω rigor, the full graph/DP/greedy families) are deliberately deferred to a later,
dedicated Advanced Algorithms topic; this topic's job is the everyday foundation those build on.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 82 runnable, heavily annotated Python examples across
  Beginner (Examples 1-28: lists, stacks, queues, hash maps, sets, linear search, sorting, recursion,
  type hints, linked lists), Intermediate (Examples 29-60: linked-list algorithms, binary and
  `bisect`-based search, heaps and priority queues, the classic comparison sorts, binary trees, binary
  search trees, and graph traversal), and Advanced (Examples 61-82: memoized and iterative Fibonacci,
  dynamic-programming-flavored recursion, BST deletion and balance checks, Dijkstra's algorithm,
  topological sort, cycle detection, quickselect, two-pointer/sliding-window techniques, an LRU cache
  built from scratch, and a prefix trie) -- plus a capstone job scheduler that ties a heap, a graph, and
  cycle detection together in one runnable program.

Every example is a complete, self-contained `.py` file colocated under `learning/code/`, runnable with
`python3 example.py` and self-checked with `assert` statements -- there is no pseudocode anywhere in
this topic.

---

Next: [Learning Overview](./learning/overview.md) →
