---
title: "Overview"
date: 2026-07-14T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to the Advanced Algorithms topic: five fixed drills that
force active recall instead of passive re-reading. Work through them in order -- short-answer recall
first, then scenario judgment, then hands-on repetition, then a checklist to confirm real automaticity,
and finally why/why-not prompts that test whether you can explain the reasoning, not just execute the
syntax. Every answer is hidden in a `<details>` block; try each item yourself before opening it.
Together, the five drills below touch every one of this topic's 28 concepts and cite specific examples
spanning all 80 worked examples in the Beginner, Intermediate, and Advanced tiers, plus the capstone.

## Recall Q&A

Twenty-eight short-answer questions, one per concept (`co-01` through `co-28`). Answer from memory,
then check.

**Q1 (co-01 -- Asymptotic Notation).** What's the difference between claiming an algorithm is O(n^2),
Omega(n^2), and Theta(n^2), and why does calling a genuinely Theta(n) algorithm merely "O(n^2)"
understate what you know?

<details>
<summary>Answer</summary>

O is an upper bound (guarantees no worse than); Omega is a lower bound (guarantees no better than);
Theta is a tight bound (both hold simultaneously, so it pins the growth rate exactly). Calling a
genuinely Theta(n) algorithm "O(n^2)" is technically true but throws away the tighter, more useful
claim -- it undersells what you actually know about the algorithm's growth (Examples 1, 2, 8, 15, 74,
78).

</details>

**Q2 (co-02 -- Amortized Analysis).** Name the three amortized-analysis techniques this topic covers,
and what each one directly measures.

<details>
<summary>Answer</summary>

Aggregate (total cost across a whole sequence, divided by the number of operations), accounting (a
credit ledger per operation that must never go negative), and potential (a function of the data
structure's state whose change, plus the actual cost, stays bounded). All three prove the same claim
-- "amortized O(1)" -- through different lenses (Examples 25, 26, 33, 77).

</details>

**Q3 (co-03 -- Recurrence Relations).** Why can't you read a recursive algorithm's source code and
immediately know its complexity?

<details>
<summary>Answer</summary>

A recursive call's own complexity depends on the complexity of the smaller subproblems it calls,
which is exactly what a recurrence like `T(n) = 2T(n/2) + n` encodes -- the "how many times does this
call itself, on what size" structure has to be turned into an equation and unrolled (or solved via
the Master theorem) before a closed-form bound like `O(n log n)` falls out (Examples 3, 4).

</details>

**Q4 (co-04 -- The Master Theorem).** What does the Master theorem let you skip that unrolling a
recurrence by hand requires?

<details>
<summary>Answer</summary>

For any recurrence of the shape `T(n) = a*T(n/b) + f(n)`, the Master theorem mechanically compares
`f(n)` against `n^(log_b a)` and picks one of three cases -- it replaces a fresh, case-by-case
unrolling derivation for every new divide-and-conquer algorithm with a single, reusable comparison
(Example 4).

</details>

**Q5 (co-05 -- Space-Time Tradeoff).** Name three structures or techniques elsewhere in this topic
that are, underneath, a deliberate space-time tradeoff.

<details>
<summary>Answer</summary>

A Fenwick or segment tree (extra `O(n)` space buys `O(log n)` range queries instead of an `O(n)`
rescan), memoization (a cache buys avoiding recomputation), and a precomputed lookup table generally
-- recognizing the tradeoff explicitly is what makes the decision to spend memory deliberate rather
than accidental (Examples 62, 78, 79).

</details>

**Q6 (co-06 -- Divide and Conquer).** What does the "combine" step do in divide-and-conquer, and why
is it often where the real complexity lives?

<details>
<summary>Answer</summary>

After the subproblems are solved independently and recursively, combine merges their results back
into a solution for the whole problem -- in merge sort, that's the linear-time merge of two sorted
halves, and in closest-pair, it's the strip check across the dividing line. The split and recurse
steps are often mechanical; the combine step is usually where the algorithm's actual cleverness (and
its complexity) concentrates (Examples 5, 29).

</details>

**Q7 (co-07 -- Merge Sort Invariants).** Why check the merge step's "output stays sorted" property
after every single append instead of only at the very end?

<details>
<summary>Answer</summary>

A property checked only at the end is a weaker, later-arriving signal -- if it fails, you know
something went wrong somewhere in the whole run, but not where. Checking continuously, right after
each append, catches a violation at the exact step that introduced it, which is strictly more useful
for debugging (Examples 5, 6).

</details>

**Q8 (co-08 -- Quicksort Partitioning).** Why does quicksort have a reputation for `O(n log n)` speed,
yet a real implementation can hit `O(n^2)`?

<details>
<summary>Answer</summary>

The `O(n log n)` reputation is an AVERAGE-case bound -- it depends on partitioning splitting the
array roughly in half. A fixed-pivot strategy (like "always the last element") degrades to `O(n^2)`
on already-sorted input, because every partition splits off just one element, mirroring the worst
case exactly (Examples 7, 8, 27, 28, 74).

</details>

**Q9 (co-09 -- Heapsort and Binary Heaps).** What does the heap property guarantee, and what does it
deliberately NOT guarantee?

<details>
<summary>Answer</summary>

It guarantees the root is always the minimum (or maximum) of the whole heap, and that every
parent-child pair obeys the ordering relation. It does NOT guarantee the heap is a fully sorted
structure at any level below the root -- siblings and cousins can be in any relative order, which is
exactly the relaxation that makes `O(log n)` push/pop possible instead of `O(n log n)` (Examples 9,
10).

</details>

**Q10 (co-10 -- Non-Comparison Sorts).** How do counting sort and radix sort beat the `n log n`
comparison-sort lower bound, and what do they give up to do it?

<details>
<summary>Answer</summary>

The `n log n` bound applies specifically to sorts that only compare pairs of elements; counting and
radix sort never compare elements at all -- they exploit a structural assumption (a small known key
range, or fixed-width digits) to place elements directly. What they give up is generality: they only
work when that structural assumption genuinely holds (Examples 11, 12).

</details>

**Q11 (co-11 -- Sort Stability).** Why is stability described as "load-bearing, not cosmetic" in this
topic?

<details>
<summary>Answer</summary>

Radix sort's correctness DEPENDS on every per-digit pass being stable -- an unstable earlier pass
would scramble the relative order that a later, more-significant digit's pass relies on to be
correct. Stability isn't a nice-to-have property here; it's a precondition the algorithm's
correctness proof assumes (Example 13).

</details>

**Q12 (co-12 -- Balanced BSTs).** What specifically makes a plain BST's `O(log n)` search bound
conditional rather than guaranteed?

<details>
<summary>Answer</summary>

A plain BST's height depends entirely on insertion order -- inserting keys in sorted order produces a
degenerate, linked-list-shaped tree with `O(n)` height, so `O(log n)` search only holds for insertion
orders that happen to keep the tree roughly balanced. AVL and red-black trees make `O(log n)` height
structural, via rotations (and, for red-black, color invariants), regardless of insertion order
(Examples 14, 15, 68, 69).

</details>

**Q13 (co-13 -- Tries).** What query can a trie answer efficiently that a hash-based dictionary
structurally cannot?

<details>
<summary>Answer</summary>

"Which strings share this prefix" -- a hash table only supports exact-key lookup; walking a trie down
to a prefix's node and counting the words beneath it answers a prefix query in
`O(prefix-length)`, which is exactly what powers autocomplete and spell-checking (Examples 16, 17).

</details>

**Q14 (co-14 -- Fenwick Tree).** Where does a Fenwick tree sit between a plain array and a
precomputed prefix-sum array, and what does it cost to get there?

<details>
<summary>Answer</summary>

A plain array gives `O(1)` point-update but `O(n)` prefix-sum query; a precomputed prefix-sum array
flips that to `O(1)` query but `O(n)` update. A Fenwick tree gets BOTH operations to `O(log n)`, at
the cost of `O(n)` extra space and code that indexes by the lowest set bit rather than the position
directly (Examples 30, 67).

</details>

**Q15 (co-15 -- Segment Tree).** What can a segment tree do that a Fenwick tree cannot, and what's
the direct cost of that extra generality?

<details>
<summary>Answer</summary>

A segment tree generalizes to any associative aggregate (min, max, GCD, sum -- not just sum) and
supports efficient RANGE updates via lazy propagation; a Fenwick tree is specialized to prefix sums
and point updates. The cost is roughly `4x` the memory and meaningfully more code to get right
(Examples 31, 32, 67).

</details>

**Q16 (co-16 -- Union-Find).** What do union-by-rank and path compression each individually
contribute to union-find's near-constant query time?

<details>
<summary>Answer</summary>

Union-by-rank keeps the resulting tree shallow by always attaching the smaller tree under the larger
tree's root (rather than risking a long chain); path compression flattens every node visited during a
`find()` directly to the root, so future queries on those same nodes are `O(1)`. Together they turn a
structure that can degrade toward a linked list into one with (amortized) near-constant-time
operations (Examples 22, 33, 34, 42).

</details>

**Q17 (co-17 -- Graph Traversal, in Depth).** What can DFS with colors and discovery/finish
timestamps distinguish that a plain visited/unvisited boolean cannot?

<details>
<summary>Answer</summary>

A plain boolean can't tell "this node is my ancestor on the current recursion path" (GRAY) apart from
"this node was already fully explored on some unrelated branch" (BLACK) -- and that distinction is
exactly what separates a genuine back-edge (a cycle) from a harmless cross-edge to an
already-finished subtree (Examples 18-21, 36, 37, 66).

</details>

**Q18 (co-18 -- Topological Sort).** Name the two standard algorithms for topological sort and the
mechanism each uses to detect a cycle.

<details>
<summary>Answer</summary>

Kahn's algorithm repeatedly removes in-degree-zero nodes -- if the output order ends up shorter than
the node count, a cycle exists (some nodes never reached in-degree zero). The DFS-based approach
reverses DFS finish order -- a back-edge encountered during the DFS (via GRAY-node coloring) signals
a cycle directly (Examples 35, 36, 37, 65, 66, 80).

</details>

**Q19 (co-19 -- Dijkstra's Shortest Path).** What specific assumption does Dijkstra's greedy strategy
depend on, and why does it fail without that assumption?

<details>
<summary>Answer</summary>

Dijkstra assumes edge weights are non-negative, which guarantees that once a node is popped from the
heap with the smallest known distance, no LATER relaxation could ever produce something smaller -- so
it's safe to finalize that node immediately. A negative edge breaks that guarantee: a cheaper path
could still arrive later through an edge that subtracts from the running total (Examples 38, 39, 43,
63, 64, 80).

</details>

**Q20 (co-20 -- Bellman-Ford).** What does Bellman-Ford's extra generality over Dijkstra cost,
concretely?

<details>
<summary>Answer</summary>

`O(V*E)` instead of `O((V+E) log V)` -- Bellman-Ford relaxes every edge `V-1` times over, never
finalizing a node early, which is exactly what makes it correct in the presence of negative edges but
also what makes it structurally slower on the common case of non-negative weights (Examples 40, 41,
63).

</details>

**Q21 (co-21 -- Minimum Spanning Tree).** Kruskal's and Prim's algorithms use entirely different
greedy strategies -- what does it mean that they still always agree on the total weight?

<details>
<summary>Answer</summary>

Kruskal's is greedy on EDGES (cheapest edge first, skipping any that would form a cycle, checked via
union-find); Prim's is greedy on NODES (cheapest edge that extends the current tree, via a heap).
That two structurally unrelated strategies always converge on the same minimum total weight is a
strong, independent correctness signal for both (Examples 42, 43).

</details>

**Q22 (co-22 -- The Greedy Paradigm).** Why is "greedy works here" a claim that has to be proven
per-problem rather than assumed to transfer?

<details>
<summary>Answer</summary>

The same locally-optimal heuristic can be provably optimal for one problem (interval scheduling by
earliest finish time) and provably WRONG for a closely related one (0/1 knapsack, where fractional
knapsack's greedy-by-ratio strategy doesn't transfer) -- the greedy-choice property is a fact about a
SPECIFIC problem's structure, not a general guarantee (Examples 44, 45, 58, 79).

</details>

**Q23 (co-23 -- Dynamic Programming, One Dimension).** Is "dynamic programming" one specific coding
pattern? What's the actual unifying principle?

<details>
<summary>Answer</summary>

No -- DP is the PRINCIPLE of never solving the same overlapping subproblem twice, implementable
either top-down (memoization: recurse normally, but cache results) or bottom-up (tabulation: fill a
table from the smallest subproblem upward). Which implementation fits best depends on the problem's
dependency structure, not on DP itself dictating one form (Examples 45-48, 58, 60, 79).

</details>

**Q24 (co-24 -- Dynamic Programming, Two Dimensions).** What does a 2D DP problem typically need
beyond just computing a final number?

<details>
<summary>Answer</summary>

A reconstruction step -- the filled table stores enough information (which choice led to each cell's
optimal value) to walk backward from the final cell and recover an actual optimal SOLUTION, not just
its numeric value. That's what a real diff tool or a version-control merge needs: not just "how
different are these," but the actual edit sequence (Examples 49-51, 59, 61, 62, 65, 80).

</details>

**Q25 (co-25 -- Backtracking).** What specifically makes backtracking fast enough to be practical,
rather than just "exponential search with extra steps"?

<details>
<summary>Answer</summary>

Checking constraints immediately after EACH placement (not only at the end) lets a hopeless branch be
abandoned the moment it becomes invalid, before any further, wasted recursion explores it -- that
early pruning is the entire difference between a fast, practical backtracking search and a
brute-force enumeration that happens to also check validity (Examples 53-57).

</details>

**Q26 (co-26 -- Two Pointers and Sliding Window).** What structural property of the input does
two-pointers (or sliding window) require that a plain nested loop doesn't need?

<details>
<summary>Answer</summary>

Sortedness or monotonicity -- two pointers converging from opposite ends only works because moving
one pointer inward has a PREDICTABLE effect on the running sum/condition (sorted data). A sliding
window's incremental update similarly relies on the window's boundary conditions being monotonic.
Without that structure, there's no way to know which pointer to move without still checking every
pair (Examples 23, 24, 70-72).

</details>

**Q27 (co-27 -- Binary Search on the Answer).** What is the actual requirement for binary search to
apply, if it isn't "the data must be a sorted array"?

<details>
<summary>Answer</summary>

Monotonicity of a predicate over a VALUE space -- if some value `V` satisfies a yes/no predicate,
every value on one side of `V` also satisfies it (and every value on the other side doesn't). That's
a much broader condition than "sorted array": it applies to "minimum capacity that lets you ship in
D days" just as well as to array indices, because the predicate "can you ship in D days with capacity
C" is monotonic in `C` (Examples 52, 60, 73).

</details>

**Q28 (co-28 -- NP-Hardness Intuition).** What's the practical choice an engineer faces once they
recognize a problem is NP-hard?

<details>
<summary>Answer</summary>

Between "guaranteed optimal, but only feasible for small inputs" (brute force) and "fast at any
realistic scale, but with no optimality guarantee" (a heuristic) -- there is, as far as anyone has
proven, no polynomial-time algorithm that gives both. Recognizing which category a NEW problem falls
into (often via a reduction from a known NP-hard problem) is itself the practical skill, separate from
actually solving the problem (Examples 75, 76).

</details>

## Applied problems

Twelve scenarios. Each describes a task without naming the algorithm or paradigm -- decide which one
solves it, then check.

**AP1.** A dataset of 50 million integers, each guaranteed to be between 0 and 999, needs to be
sorted as fast as possible, and a comparison-based sort's `n log n` floor feels like it's leaving
performance on the table.

<details>
<summary>Answer</summary>

This is a non-comparison-sort opportunity (co-10) -- the key range is small and known (0-999), which
is exactly the structural assumption counting sort exploits: `O(n+k)` with `k=1000`, no comparisons
at all, beating the `n log n` floor that only bounds comparison sorts (Examples 11, 12).

</details>

**AP2.** A router needs to answer "what's the best next hop for any IP address matching this prefix"
against a table of hundreds of thousands of prefixes, with lookups on the hot path.

<details>
<summary>Answer</summary>

This calls for a trie (co-13) -- a hash table can't efficiently answer a prefix query at all, while
walking a trie down to the matching prefix's node is `O(prefix-length)`, independent of how many
other prefixes are stored (Examples 16, 17).

</details>

**AP3.** An array of a million sensor readings needs frequent "sum of readings between index i and
j" queries, interleaved with occasional single-reading corrections.

<details>
<summary>Answer</summary>

A Fenwick tree (co-14) -- both point-update (correcting one reading) and prefix-sum query (used to
compute any range sum by subtraction) land in `O(log n)`, the efficient middle ground between an
`O(1)`-update-but-`O(n)`-query plain array and an `O(1)`-query-but-`O(n)`-update precomputed prefix
array (Examples 30, 67).

</details>

**AP4.** The same range-query workload as above, except the aggregate needed is range-MINIMUM, not
range-sum, and some updates need to touch an entire range at once, not just one index.

<details>
<summary>Answer</summary>

A segment tree with lazy propagation (co-15) -- a Fenwick tree is specialized to prefix sums; a
segment tree generalizes to any associative aggregate (min included) and supports efficient RANGE
updates via lazy propagation, at the cost of more code and memory (Examples 31, 32, 67).

</details>

**AP5.** A build system needs to determine a valid execution order for a set of tasks with
"depends on" edges between them, and must also detect if someone accidentally created a circular
dependency.

<details>
<summary>Answer</summary>

Topological sort with cycle detection (co-18) -- Kahn's algorithm (or the DFS-based variant) produces
the valid order directly, and a shorter-than-expected output (Kahn's) or a detected back-edge (DFS)
is exactly the cycle signal (Examples 35-37, 65, 66, 80).

</details>

**AP6.** A delivery-routing service needs shortest travel times across a road network where every
edge weight (travel time) is guaranteed non-negative, and speed matters at production scale.

<details>
<summary>Answer</summary>

Dijkstra's algorithm with a heap (co-19) -- since all weights are non-negative, Dijkstra's greedy
finalize-on-pop strategy is valid and its `O((V+E) log V)` beats Bellman-Ford's `O(V*E)`, which is
only needed when negative weights are possible (Examples 38, 39, 43, 63).

</details>

**AP7.** A currency-arbitrage detector needs shortest "cost" paths through a graph of exchange rates,
where some edges are effectively negative (a profitable trade), and the system must also flag if a
truly infinite-profit cycle exists.

<details>
<summary>Answer</summary>

Bellman-Ford (co-20) -- it's the only one of the two shortest-path algorithms in this topic that
tolerates negative edges at all, and its extra relaxation round is precisely the mechanism for
detecting a negative cycle (which, in this domain, would represent unbounded arbitrage profit)
(Examples 40, 41).

</details>

**AP8.** A network operator wants to connect every office in a company to a shared backbone at the
lowest total cable cost, with no requirement that any single path between two offices be short --
just that everything is connected as cheaply as possible.

<details>
<summary>Answer</summary>

A minimum spanning tree, via Kruskal's or Prim's (co-21) -- this is not a shortest-path problem
(which optimizes cost between two specific nodes); it's a spanning problem (minimize the TOTAL cost
of a tree connecting every node), which is exactly what MST algorithms solve, and either algorithm
gives the same optimal total (Examples 42, 43).

</details>

**AP9.** A scheduling problem needs to select the maximum number of non-overlapping meeting requests
from a room's booking calendar, and a proof exists that always picking the request that finishes
earliest next never rules out an optimal solution.

<details>
<summary>Answer</summary>

The greedy paradigm applies directly here (co-22), because the problem statement includes the proof
that the greedy-choice property genuinely holds -- this is interval scheduling, one of the few
problems in this topic where greedy is proven optimal, not just heuristically reasonable (Example
44).

</details>

**AP10.** A superficially similar-looking problem -- pick a subset of items, each with a weight and a
value, to maximize value without exceeding a weight capacity -- turns out to give the WRONG answer
when solved with the same "greedy by value/weight ratio" strategy that worked for the fractional
version.

<details>
<summary>Answer</summary>

This is 0/1 knapsack, and it needs 2D dynamic programming instead of greedy (co-24, co-22) -- greedy's
optimality was specific to the FRACTIONAL version (where you can take a partial item); the 0/1
constraint (each item is all-or-nothing) breaks the greedy-choice property, and only DP, exploring
every combination via the table, finds the true optimum (Example 58).

</details>

**AP11.** A puzzle-solving program needs to place pieces onto a board one at a time, immediately
rejecting any placement that violates a constraint, and continuing to explore only the placements
that remain valid so far.

<details>
<summary>Answer</summary>

Backtracking (co-25) -- the defining characteristic (commit to a choice, recurse, immediately abandon
any branch that violates a constraint) is exactly this shape; N-Queens, Sudoku, and constrained
placement puzzles all reduce to backtracking with problem-specific validity checks (Examples 53, 57).

</details>

**AP12.** An optimization problem is suspected to be NP-hard, but the team needs SOME answer today,
even if it isn't provably optimal, because waiting for an exact brute-force solution isn't feasible
at the problem's real-world size.

<details>
<summary>Answer</summary>

Settle for a heuristic (co-28) -- once a problem is recognized as NP-hard (or is suspected to be,
pending a reduction proof), the practical engineering choice is between guaranteed-optimal-but-
infeasible-at-scale and fast-but-unguaranteed; a nearest-neighbor-style heuristic (as used for TSP)
trades the optimality guarantee for tractability (Examples 75, 76).

</details>

## Code katas

Ten hands-on repetition drills. Each is a before/after `.py` file colocated under `drilling/code/`.
Every "before" script is a real, runnable Python program that misapplies the concept being drilled --
run it yourself, diagnose the bug from the observed behavior, fix it from memory, then compare your
fix against the "after" script and the model solution before checking your work against the
actually-executed output shown.

### Kata 1 -- Quicksort Partitioning: a partition that "succeeds" silently leaves the array unsorted

_relates to co-08, Examples 7-8, 27_

**Task.** `quicksort()` should sort the array in place using Lomuto partitioning. The version below is
broken: `partition()` never swaps the pivot into its final sorted position, so the pivot simply never
moves and the recursion never actually converges on a correctly sorted array.

**Before** (`drilling/code/kata-01-lomuto-partition-off-by-one/before/kata.py`)

```python
"""Kata 1 (before): Lomuto partition forgets to swap the pivot into its final sorted position."""


def partition(arr: list[int], low: int, high: int) -> int:
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    return high  # BUG: never swaps arr[i + 1] with arr[high] -- the pivot never actually moves


def quicksort(arr: list[int], low: int, high: int) -> None:
    if low < high:
        p = partition(arr, low, high)
        quicksort(arr, low, p - 1)
        quicksort(arr, p + 1, high)


data = [5, 3, 8, 4, 2]
quicksort(data, 0, len(data) - 1)
print(data)
print(data == sorted([5, 3, 8, 4, 2]))
```

**Observed (buggy) output** (captured by actually running the script above):

```text
[3, 5, 8, 4, 2]
False
```

**After** (`drilling/code/kata-01-lomuto-partition-off-by-one/after/kata.py`)

```python
"""Kata 1 (after): Lomuto partition swaps the pivot into its final sorted position before returning."""


def partition(arr: list[int], low: int, high: int) -> int:
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]  # => the pivot moves to its correct sorted index
    return i + 1


def quicksort(arr: list[int], low: int, high: int) -> None:
    if low < high:
        p = partition(arr, low, high)
        quicksort(arr, low, p - 1)
        quicksort(arr, p + 1, high)


data = [5, 3, 8, 4, 2]
quicksort(data, 0, len(data) - 1)
print(data)
print(data == sorted([5, 3, 8, 4, 2]))
```

<details>
<summary>Model solution</summary>

**Root cause**: the partition function moved every element `<= pivot` into the left region but never
performed the final swap that places the pivot itself between the `<= pivot` and `> pivot` regions --
without that swap, the pivot stays wherever it started, and the "partition point" returned to the
caller does not reflect any real separation.

**Run**: `python3 kata.py`

**Output**:

```text
[2, 3, 4, 5, 8]
True
```

</details>

### Kata 2 -- Heapsort and Binary Heaps: a one-child sift-down breaks the heap deeper down

_relates to co-09, Examples 9-10_

**Task.** `heapify()` should turn any array into a valid min-heap, where every parent is `<=` both of
its children. The version below is broken: `sift_down()` only ever compares against the LEFT child,
so a smaller right child never gets the chance to surface.

**Before** (`drilling/code/kata-02-heap-siftdown-ignores-right-child/before/kata.py`)

```python
"""Kata 2 (before): sift-down only compares the left child, so a smaller right child never surfaces."""


def sift_down(heap: list[int], i: int, n: int) -> None:
    while True:
        left = 2 * i + 1
        if left >= n:
            break
        smallest = left  # BUG: never compares against the right child (2 * i + 2)
        if heap[smallest] < heap[i]:
            heap[i], heap[smallest] = heap[smallest], heap[i]
            i = smallest
        else:
            break


def heapify(arr: list[int]) -> list[int]:
    heap = list(arr)
    n = len(heap)
    for i in range(n // 2 - 1, -1, -1):
        sift_down(heap, i, n)
    return heap


def is_min_heap(heap: list[int]) -> bool:
    n = len(heap)
    for i in range(n):
        left, right = 2 * i + 1, 2 * i + 2
        if left < n and heap[i] > heap[left]:
            return False
        if right < n and heap[i] > heap[right]:
            return False
    return True


heap = heapify([5, 1, 9, 2, 8, 3, 0])
print(heap)
print(is_min_heap(heap))  # expected True for a real min-heap -- checks EVERY node, not just the root
```

**Observed (buggy) output** (captured by actually running the script above):

```text
[1, 2, 3, 5, 8, 9, 0]
False
```

**After** (`drilling/code/kata-02-heap-siftdown-ignores-right-child/after/kata.py`)

```python
"""Kata 2 (after): sift-down compares BOTH children and picks the smaller one before swapping."""


def sift_down(heap: list[int], i: int, n: int) -> None:
    while True:
        left, right = 2 * i + 1, 2 * i + 2
        smallest = i
        if left < n and heap[left] < heap[smallest]:
            smallest = left
        if right < n and heap[right] < heap[smallest]:  # => now genuinely considers the right child too
            smallest = right
        if smallest == i:
            break
        heap[i], heap[smallest] = heap[smallest], heap[i]
        i = smallest


def heapify(arr: list[int]) -> list[int]:
    heap = list(arr)
    n = len(heap)
    for i in range(n // 2 - 1, -1, -1):
        sift_down(heap, i, n)
    return heap


def is_min_heap(heap: list[int]) -> bool:
    n = len(heap)
    for i in range(n):
        left, right = 2 * i + 1, 2 * i + 2
        if left < n and heap[i] > heap[left]:
            return False
        if right < n and heap[i] > heap[right]:
            return False
    return True


heap = heapify([5, 1, 9, 2, 8, 3, 0])
print(heap)
print(is_min_heap(heap))
```

<details>
<summary>Model solution</summary>

**Root cause**: sift-down only ever considered the left child as the swap candidate, so whenever the
RIGHT child was the smaller of the two, the heap property silently failed to hold at that node --
`is_min_heap()` catches this because it checks every node, not just the root, which still happens to
end up correct by coincidence on many inputs.

**Run**: `python3 kata.py`

**Output**:

```text
[0, 1, 3, 2, 8, 5, 9]
True
```

</details>

### Kata 3 -- Sort Stability: a selection sort's long-range swap scrambles equal-key order

_relates to co-11, Example 13_

**Task.** Sorting students by grade should keep students with the SAME grade in their original
relative order. The version below is broken: a swap-based selection sort can jump an element past
another element with an equal key, losing the original order between them.

**Before** (`drilling/code/kata-03-selection-sort-breaks-stability/before/kata.py`)

```python
"""Kata 3 (before): a swap-based selection sort is unstable -- equal-key records lose their input order."""


def selection_sort_by_grade(students: list[tuple[int, str]]) -> list[tuple[int, str]]:
    arr = list(students)
    n = len(arr)
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j][0] < arr[min_idx][0]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]  # SMELL: a long-range swap can jump equal keys apart
    return arr


students = [(90, "alice"), (85, "bob"), (90, "carol"), (85, "dave")]
result = selection_sort_by_grade(students)
print(result)
# expected: alice before carol (both 90), bob before dave (both 85) -- their ORIGINAL relative order
print(result == [(85, "bob"), (85, "dave"), (90, "alice"), (90, "carol")])
```

**Observed (buggy) output** (captured by actually running the script above):

```text
[(85, 'bob'), (85, 'dave'), (90, 'carol'), (90, 'alice')]
False
```

**After** (`drilling/code/kata-03-selection-sort-breaks-stability/after/kata.py`)

```python
"""Kata 3 (after): Python's sorted() is stable -- equal-key records keep their original relative order."""


def stable_sort_by_grade(students: list[tuple[int, str]]) -> list[tuple[int, str]]:
    return sorted(students, key=lambda record: record[0])  # => stable: never reorders equal-key pairs


students = [(90, "alice"), (85, "bob"), (90, "carol"), (85, "dave")]
result = stable_sort_by_grade(students)
print(result)
print(result == [(85, "bob"), (85, "dave"), (90, "alice"), (90, "carol")])
```

<details>
<summary>Model solution</summary>

**Root cause**: selection sort's long-range swap can move an element past another element with an
equal key without either of them ever being compared to each other directly, silently reordering them
-- `sorted()` is guaranteed stable by the language, which is exactly why it's the correct default
choice whenever equal-key order matters.

**Run**: `python3 kata.py`

**Output**:

```text
[(85, 'bob'), (85, 'dave'), (90, 'alice'), (90, 'carol')]
True
```

</details>

### Kata 4 -- Union-Find: attaching raw nodes instead of roots orphans an earlier union

_relates to co-16, Examples 22, 33, 34_

**Task.** After `union(0, 1)` and then `union(0, 2)`, all three of 0, 1, and 2 should be one connected
group. The version below is broken: `union()` overwrites `parent[a]` directly instead of resolving
`a`'s CURRENT root first, silently orphaning an earlier link.

**Before** (`drilling/code/kata-04-union-find-raw-node-attach/before/kata.py`)

```python
"""Kata 4 (before): union() attaches the raw nodes instead of their ROOTS, orphaning an earlier link."""


class UnionFind:
    def __init__(self, n: int) -> None:
        self.parent = list(range(n))

    def find(self, x: int) -> int:
        while self.parent[x] != x:
            x = self.parent[x]
        return x

    def union(self, a: int, b: int) -> None:
        self.parent[a] = b  # BUG: overwrites parent[a] directly, ignoring find(a) -- can orphan an old link


uf = UnionFind(3)
uf.union(0, 1)  # 0 and 1 are now one group
uf.union(0, 2)  # intent: merge {0, 1} and {2} into one group of all three
print(uf.find(0) == uf.find(1))  # expected True -- 0 and 1 were explicitly unioned, but the link is now lost
```

**Observed (buggy) output** (captured by actually running the script above):

```text
False
```

**After** (`drilling/code/kata-04-union-find-raw-node-attach/after/kata.py`)

```python
"""Kata 4 (after): union() finds and attaches the ROOTS, so an earlier link is never orphaned."""


class UnionFind:
    def __init__(self, n: int) -> None:
        self.parent = list(range(n))

    def find(self, x: int) -> int:
        while self.parent[x] != x:
            x = self.parent[x]
        return x

    def union(self, a: int, b: int) -> None:
        root_a, root_b = self.find(a), self.find(b)  # => resolves to CURRENT roots before attaching
        if root_a != root_b:
            self.parent[root_a] = root_b


uf = UnionFind(3)
uf.union(0, 1)
uf.union(0, 2)
print(uf.find(0) == uf.find(1))
print(uf.find(1) == uf.find(2))  # the whole group of three is now correctly connected
```

<details>
<summary>Model solution</summary>

**Root cause**: overwriting `parent[a]` directly discards whatever `a` was already pointing to --
when `a` already had a parent from an earlier `union()`, that earlier link is silently replaced
rather than merged with. Resolving both `a` and `b` to their CURRENT roots first, then attaching root
to root, is what makes repeated unions compose correctly.

**Run**: `python3 kata.py`

**Output**:

```text
True
True
```

</details>

### Kata 5 -- Topological Sort: Kahn's algorithm silently returns a short, wrong order on a cycle

_relates to co-18, Examples 35-37_

**Task.** `topo_sort()` should either return a valid linear order or signal that the graph has a
cycle (which has none). The version below is broken: it returns whatever order it managed to build,
with no check that every node was actually placed.

**Before** (`drilling/code/kata-05-kahn-topsort-silently-drops-cycle/before/kata.py`)

```python
"""Kata 5 (before): Kahn's algorithm returns a SHORT, silently-incomplete order for a cyclic graph."""

from collections import deque


def topo_sort(graph: dict[str, list[str]]) -> list[str]:
    in_degree: dict[str, int] = {node: 0 for node in graph}
    for node in graph:
        for neighbor in graph[node]:
            in_degree[neighbor] += 1

    queue: deque[str] = deque(node for node in graph if in_degree[node] == 0)
    order: list[str] = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
    return order  # BUG: never checks len(order) == len(graph) -- a cycle just produces a short, wrong list


graph = {"a": ["b"], "b": ["c"], "c": ["a"]}  # a -> b -> c -> a is a cycle: no valid topological order exists
order = topo_sort(graph)
print(order)
print(len(order) == len(graph))  # a caller trusting `order` with no length check gets a SILENTLY wrong result
```

**Observed (buggy) output** (captured by actually running the script above):

```text
[]
False
```

**After** (`drilling/code/kata-05-kahn-topsort-silently-drops-cycle/after/kata.py`)

```python
"""Kata 5 (after): Kahn's algorithm checks the output length and raises if a cycle made the DAG assumption false."""

from collections import deque


class CycleError(Exception):
    pass


def topo_sort(graph: dict[str, list[str]]) -> list[str]:
    in_degree: dict[str, int] = {node: 0 for node in graph}
    for node in graph:
        for neighbor in graph[node]:
            in_degree[neighbor] += 1

    queue: deque[str] = deque(node for node in graph if in_degree[node] == 0)
    order: list[str] = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    if len(order) != len(graph):  # => the precondition check: a DAG must place EVERY node
        raise CycleError(f"graph has a cycle -- only {len(order)}/{len(graph)} nodes reached in-degree 0")
    return order


graph = {"a": ["b"], "b": ["c"], "c": ["a"]}
try:
    topo_sort(graph)
except CycleError as error:
    print(error)
```

<details>
<summary>Model solution</summary>

**Root cause**: Kahn's algorithm can only place a node once its in-degree reaches zero -- on a pure
cycle, NO node ever reaches in-degree zero, so the queue starts empty and the loop never runs at all,
silently returning an empty list. Checking `len(order) == len(graph)` after the loop is the
mechanical way to detect this and fail loudly instead of returning a silently-wrong partial order.

**Run**: `python3 kata.py`

**Output**:

```text
graph has a cycle -- only 0/3 nodes reached in-degree 0
```

</details>

### Kata 6 -- Dijkstra vs. Bellman-Ford: a finalized node silently blocks a negative-edge improvement

_relates to co-19, co-20, Examples 38, 40, 63_

**Task.** The true shortest `s -> c` distance in the graph below is `-5` (via `s -> a -> b -> c`).
The version below is broken: it uses Dijkstra with a `visited` set that finalizes each node on its
first pop, which is exactly the assumption a negative edge violates.

**Before** (`drilling/code/kata-06-dijkstra-negative-edge-wrong-distance/before/kata.py`)

```python
"""Kata 6 (before): a `visited` set finalizes each node on first pop, silently corrupting downstream distances on a negative edge."""

import heapq
import math


def dijkstra(graph: dict[str, list[tuple[str, int]]], source: str) -> dict[str, float]:
    dist: dict[str, float] = {node: math.inf for node in graph}
    dist[source] = 0
    visited: set[str] = set()
    heap: list[tuple[float, str]] = [(0, source)]
    while heap:
        d, node = heapq.heappop(heap)
        if node in visited:
            continue
        visited.add(node)  # BUG: once a node is finalized, it is NEVER reprocessed, even if dist improves later
        for neighbor, weight in graph[node]:
            new_dist = d + weight
            if new_dist < dist[neighbor]:
                dist[neighbor] = new_dist
                heapq.heappush(heap, (new_dist, neighbor))
    return dist


# S -> B costs 1 directly; S -> A -> B costs 4 + (-10) = -6, the TRUE shortest -- but B gets finalized
# via the direct edge BEFORE the negative-weight improvement from A ever arrives.
graph = {"s": [("b", 1), ("a", 4)], "a": [("b", -10)], "b": [("c", 1)], "c": []}
result = dijkstra(graph, "s")
print(result["c"])
print(result["c"] == -5)  # TRUE shortest s -> c is s -> a -> b -> c = 4 - 10 + 1 = -5
```

**Observed (buggy) output** (captured by actually running the script above):

```text
2
False
```

**After** (`drilling/code/kata-06-dijkstra-negative-edge-wrong-distance/after/kata.py`)

```python
"""Kata 6 (after): Bellman-Ford relaxes every edge repeatedly -- no finalization, so negative edges are handled correctly."""

import math


def bellman_ford(graph: dict[str, list[tuple[str, int]]], source: str) -> dict[str, float]:
    dist: dict[str, float] = {node: math.inf for node in graph}
    dist[source] = 0
    for _ in range(len(graph) - 1):  # => relax every edge |V| - 1 times -- no node is ever "finalized" early
        for node, edges in graph.items():
            if dist[node] == math.inf:
                continue
            for neighbor, weight in edges:
                if dist[node] + weight < dist[neighbor]:
                    dist[neighbor] = dist[node] + weight
    return dist


graph = {"s": [("b", 1), ("a", 4)], "a": [("b", -10)], "b": [("c", 1)], "c": []}
result = bellman_ford(graph, "s")
print(result["c"])
print(result["c"] == -5)
```

<details>
<summary>Model solution</summary>

**Root cause**: Dijkstra's `visited` set finalizes B the moment it is first popped (via the cheap
DIRECT edge, distance 1), and B is never reprocessed even after A's negative edge later discovers a
better distance to B -- so the improvement never propagates on to C. Bellman-Ford has no notion of
"finalized"; it relaxes every edge repeatedly, so the negative-edge improvement is guaranteed to
propagate correctly within `V-1` rounds.

**Run**: `python3 kata.py`

**Output**:

```text
-5
True
```

</details>

### Kata 7 -- The Greedy Paradigm: biggest-coin-first is suboptimal on a non-canonical coin set

_relates to co-22, co-23, Example 45_

**Task.** Making 6 units of change from coins `{1, 3, 4}` should use the FEWEST coins possible. The
version below is broken: it greedily takes the largest coin that fits first, which has no optimality
proof for this coin set.

**Before** (`drilling/code/kata-07-greedy-coin-change-noncanonical/before/kata.py`)

```python
"""Kata 7 (before): greedy coin change picks the largest coin first, which is SUBOPTIMAL on this coin set."""


def greedy_coin_change(coins: list[int], target: int) -> list[int]:
    result: list[int] = []
    remaining = target
    for coin in sorted(coins, reverse=True):  # SMELL: "always take the biggest coin" has no optimality proof
        while remaining >= coin:
            result.append(coin)
            remaining -= coin
    return result


coins = [1, 3, 4]  # a NON-canonical coin set -- greedy's optimality only holds for specific coin systems
change = greedy_coin_change(coins, 6)
print(change)
print(len(change))
print(len(change) == 2)  # optimal is [3, 3] -- 2 coins -- but greedy takes 4 first, forcing 4 + 1 + 1 = 3 coins
```

**Observed (buggy) output** (captured by actually running the script above):

```text
[4, 1, 1]
3
False
```

**After** (`drilling/code/kata-07-greedy-coin-change-noncanonical/after/kata.py`)

```python
"""Kata 7 (after): DP tries every coin at every amount, so it finds the true minimum regardless of coin set."""

import math


def dp_coin_change(coins: list[int], target: int) -> list[int]:
    # best[amount] = the fewest coins that sum to `amount`; best[0] = 0 coins, everything else starts at inf
    best: list[float] = [0.0] + [math.inf] * target
    choice: list[int] = [-1] * (target + 1)
    for amount in range(1, target + 1):
        for coin in coins:  # => tries EVERY coin, not just the biggest one -- no greedy assumption baked in
            if coin <= amount and best[amount - coin] + 1 < best[amount]:
                best[amount] = best[amount - coin] + 1
                choice[amount] = coin

    result: list[int] = []
    amount = target
    while amount > 0:
        result.append(choice[amount])
        amount -= choice[amount]
    return result


coins = [1, 3, 4]
change = dp_coin_change(coins, 6)
print(change)
print(len(change))
print(len(change) == 2)
```

<details>
<summary>Model solution</summary>

**Root cause**: "always take the largest coin that fits" has no proof of optimality for an arbitrary
coin set -- it happens to be optimal for canonical coin systems (like US currency) but fails on `{1,
3, 4}`, where taking 4 first forces two more 1-coins. DP explores every coin choice at every amount,
so it finds the genuine minimum regardless of whether the coin set is canonical.

**Run**: `python3 kata.py`

**Output**:

```text
[3, 3]
2
True
```

</details>

### Kata 8 -- Dynamic Programming: naive recursion re-solves the same subproblem exponentially often

_relates to co-23, Example 46_

**Task.** Computing `fib(25)` should take roughly linear work in `n`. The version below is broken: it
recomputes every overlapping subproblem from scratch, with no cache at all.

**Before** (`drilling/code/kata-08-fibonacci-missing-memo-blowup/before/kata.py`)

```python
"""Kata 8 (before): naive recursive Fibonacci re-solves the SAME subproblem exponentially many times."""

calls = 0


def fib(n: int) -> int:
    global calls
    calls += 1
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)  # BUG: no cache -- fib(n - 2) is fully re-computed inside fib(n - 1) too


result = fib(25)
print(result)
print(calls)
print(calls > 100_000)  # naive fib(25) calls itself 242,785 times for a result that needs only 25 additions
```

**Observed (buggy) output** (captured by actually running the script above):

```text
75025
242785
True
```

**After** (`drilling/code/kata-08-fibonacci-missing-memo-blowup/after/kata.py`)

```python
"""Kata 8 (after): memoization caches each subproblem's result, so it is only ever solved ONCE."""

calls = 0
cache: dict[int, int] = {}


def fib(n: int) -> int:
    global calls
    calls += 1
    if n in cache:  # => already solved this exact subproblem -- reuse it instead of re-recursing
        return cache[n]
    if n <= 1:
        return n
    result = fib(n - 1) + fib(n - 2)
    cache[n] = result
    return result


result = fib(25)
print(result)
print(calls)
print(calls <= 2 * 25 + 1)  # memoized fib(25) makes O(n) calls -- 49, not 242,785
```

<details>
<summary>Model solution</summary>

**Root cause**: `fib(n - 1)` internally recomputes `fib(n - 2)` all over again, and that duplication
compounds at every level of the recursion tree, producing exponentially many redundant calls. Caching
each `n`'s result the first time it's computed means every subsequent request for that same `n`
returns instantly instead of re-recursing -- the exact "never solve the same subproblem twice"
principle DP is built on.

**Run**: `python3 kata.py`

**Output**:

```text
75025
49
True
```

</details>

### Kata 9 -- Backtracking: forgetting to undo a placement poisons every later attempt

_relates to co-25, Example 53_

**Task.** `count_solutions(4)` should find the well-known 2 valid 4-Queens placements. The version
below is broken: it never removes a placed queen's column from the "used" set after a recursive call
returns, so the board is never truly reset between attempts.

**Before** (`drilling/code/kata-09-nqueens-missing-backtrack-unmark/before/kata.py`)

```python
"""Kata 9 (before): backtracking never un-marks a placed queen, so a rejected branch poisons every later attempt."""


def count_solutions(n: int) -> int:
    cols: set[int] = set()
    solutions = 0

    def is_safe(row: int, col: int, placed: list[int]) -> bool:
        for r, c in enumerate(placed):
            if c == col or abs(c - col) == abs(r - row):
                return False
        return True

    def place(row: int, placed: list[int]) -> None:
        nonlocal solutions
        if row == n:
            solutions += 1
            return
        for col in range(n):
            if col in cols:
                continue
            if is_safe(row, col, placed):
                cols.add(col)
                placed.append(col)
                place(row + 1, placed)
                # BUG: never removes `col` from `cols` or pops `placed` -- the board is never truly reset

    place(0, [])
    return solutions


print(count_solutions(4))
print(count_solutions(4) == 2)  # N=4 has exactly 2 valid solutions -- the true, well-known answer
```

**Observed (buggy) output** (captured by actually running the script above):

```text
0
False
```

**After** (`drilling/code/kata-09-nqueens-missing-backtrack-unmark/after/kata.py`)

```python
"""Kata 9 (after): backtracking un-marks the queen after each recursive call, so the board resets between attempts."""


def count_solutions(n: int) -> int:
    cols: set[int] = set()
    solutions = 0

    def is_safe(row: int, col: int, placed: list[int]) -> bool:
        for r, c in enumerate(placed):
            if c == col or abs(c - col) == abs(r - row):
                return False
        return True

    def place(row: int, placed: list[int]) -> None:
        nonlocal solutions
        if row == n:
            solutions += 1
            return
        for col in range(n):
            if col in cols:
                continue
            if is_safe(row, col, placed):
                cols.add(col)
                placed.append(col)
                place(row + 1, placed)
                cols.remove(col)  # => UNDO: this is the actual "backtrack" step -- reset before trying the next column
                placed.pop()

    place(0, [])
    return solutions


print(count_solutions(4))
print(count_solutions(4) == 2)
```

<details>
<summary>Model solution</summary>

**Root cause**: the search commits a column to `cols` on the way down but never releases it on the
way back up -- after the very first full-depth attempt returns (successful or not), every column
used along that attempt remains permanently "used," so no later sibling branch can ever place a queen
in an already-visited column again. The missing `cols.remove(col)` / `placed.pop()` pair IS the
"backtrack" in backtracking -- without it, this is just a single depth-first probe, not a search.

**Run**: `python3 kata.py`

**Output**:

```text
2
True
```

</details>

### Kata 10 -- Sliding Window: a window that only grows over-counts a run with a repeat

_relates to co-26, Example 71_

**Task.** The longest substring of `"abcabcbb"` without a repeated character is `"abc"`, length 3.
The version below is broken: it detects a duplicate character but never actually shrinks the window's
left edge, so the window keeps growing past every repeat.

**Before** (`drilling/code/kata-10-sliding-window-never-shrinks/before/kata.py`)

```python
"""Kata 10 (before): the window only grows -- the left edge never advances past a duplicate, so it over-counts."""


def longest_unique_substring(s: str) -> int:
    seen: set[str] = set()
    left = 0
    best = 0
    for right in range(len(s)):
        if s[right] in seen:
            pass  # BUG: detects the duplicate but never moves `left` forward or evicts anything from `seen`
        seen.add(s[right])
        best = max(best, right - left + 1)
    return best


print(longest_unique_substring("abcabcbb"))
print(longest_unique_substring("abcabcbb") == 3)  # true answer is 3 ("abc") -- the window must SHRINK on a repeat
```

**Observed (buggy) output** (captured by actually running the script above):

```text
8
False
```

**After** (`drilling/code/kata-10-sliding-window-never-shrinks/after/kata.py`)

```python
"""Kata 10 (after): on a duplicate, the window's left edge advances past the PREVIOUS occurrence -- it genuinely shrinks."""


def longest_unique_substring(s: str) -> int:
    last_seen: dict[str, int] = {}
    left = 0
    best = 0
    for right, ch in enumerate(s):
        if ch in last_seen and last_seen[ch] >= left:
            left = last_seen[ch] + 1  # => SHRINK: jump the left edge past the earlier occurrence of `ch`
        last_seen[ch] = right
        best = max(best, right - left + 1)
    return best


print(longest_unique_substring("abcabcbb"))
print(longest_unique_substring("abcabcbb") == 3)
```

<details>
<summary>Model solution</summary>

**Root cause**: detecting a duplicate is not the same as RESPONDING to it -- the buggy version notices
`s[right] in seen` but takes no action, so `left` never advances and the window's length keeps
growing across every repeat, over-counting the whole string. The fix tracks each character's most
recent INDEX (not just membership) and jumps `left` directly past that index the moment a repeat
within the current window is found, which is what makes the window's length always reflect a
genuinely repeat-free run.

**Run**: `python3 kata.py`

**Output**:

```text
3
True
```

</details>

## Self-check checklist

Work through this list without looking anything up. Every item should be something you can do from
memory, not something you'd need to search for.

**Complexity foundations (co-01 to co-05)**

- [ ] I can name which of Theta, Omega, and O a specific complexity claim is asserting, and explain
      why they aren't interchangeable (co-01).
- [ ] I can apply all three amortized-analysis techniques (aggregate, accounting, potential) to the
      same doubling-array example (co-02).
- [ ] I can write and unroll a recurrence relation for a recursive algorithm I'm reading for the
      first time (co-03).
- [ ] I can apply the Master theorem to classify a divide-and-conquer recurrence into one of its
      three cases (co-04).
- [ ] I can name a concrete example of a space-time tradeoff elsewhere in this topic without looking
      it up (co-05).

**Sorting paradigms (co-06 to co-11)**

- [ ] I can implement merge sort from memory and explain what its merge-step invariant is (co-06,
      co-07).
- [ ] I can implement Lomuto-partition quicksort and explain exactly why a fixed pivot degrades on
      sorted input (co-08).
- [ ] I can implement heapsort's sift-down and explain the heap property it maintains (co-09).
- [ ] I can implement counting sort and explain why it beats the `n log n` comparison-sort lower
      bound (co-10).
- [ ] I can demonstrate, with a concrete example, the difference between a stable and an unstable
      sort's output on equal keys (co-11).

**Trees and range structures (co-12 to co-16)**

- [ ] I can explain why a plain BST's `O(log n)` bound is conditional on insertion order, and how
      AVL/red-black trees remove that condition (co-12).
- [ ] I can implement a trie's insert/lookup and explain what query it answers that a hash table
      cannot (co-13).
- [ ] I can implement a Fenwick tree's point-update and prefix-sum operations (co-14).
- [ ] I can implement a segment tree's range-query, and explain what it can do that a Fenwick tree
      cannot (co-15).
- [ ] I can implement union-find with both union-by-rank and path compression, and explain what each
      contributes (co-16).

**Graph algorithms (co-17 to co-21)**

- [ ] I can implement DFS with discovery/finish timestamps and vertex colors, and explain what that
      extra state enables (co-17).
- [ ] I can implement both Kahn's and the DFS-based topological sort, including cycle detection
      (co-18).
- [ ] I can implement Dijkstra with a heap and state precisely the assumption its correctness depends
      on (co-19).
- [ ] I can implement Bellman-Ford and explain what its extra generality costs relative to Dijkstra
      (co-20).
- [ ] I can implement both Kruskal's and Prim's MST algorithms and explain why they always agree on
      total weight (co-21).

**Algorithmic paradigms (co-22 to co-25)**

- [ ] I can state the greedy-choice property and give one example where it holds and one closely
      related problem where it doesn't (co-22).
- [ ] I can implement the same problem both top-down (memoized) and bottom-up (tabulated), and
      explain when each fits better (co-23).
- [ ] I can implement a 2D DP table with a reconstruction step, not just the final numeric answer
      (co-24).
- [ ] I can implement a backtracking search with early pruning and explain why the pruning is what
      makes it fast (co-25).

**Search patterns and tractability (co-26 to co-28)**

- [ ] I can implement both a two-pointer scan and a sliding window, and explain the monotonicity
      assumption each depends on (co-26).
- [ ] I can binary-search a monotonic predicate over a value space that is not an array index (co-27).
- [ ] I can explain, in my own words, what makes a problem NP-hard and what the practical choice is
      once you recognize one (co-28).

## Elaborative interrogation & self-explanation

Ten why/why-not prompts. Answer in your own words before checking -- the goal is explaining the
reasoning, not reciting a definition. All ten trace back to this topic's cross-cutting big idea,
`abstraction-and-its-cost`: every paradigm here is a resource trade, and naming the trade explicitly
is what turns "this happens to work" into a defensible engineering decision.

**W1.** Why does this topic frame "space-time tradeoff" (co-05) as touching nearly every other
technique here, rather than being just one item among 28?

<details>
<summary>Answer</summary>

Because almost every optimization technique in this topic IS a space-time tradeoff wearing a
different name -- a Fenwick or segment tree spends `O(n)` extra memory to turn an `O(n)` scan into an
`O(log n)` query; memoization spends a cache to avoid recomputation; a space-rolled DP table
deliberately gives that memory back once it's no longer needed. Recognizing co-05 explicitly is what
turns "this happens to be faster" into "I am spending X memory to buy Y time, and here's why that's
worth it" -- the abstraction-and-its-cost idea made concrete and measurable.

</details>

**W2.** Why is "greedy is optimal for problem A" not evidence that greedy will also be optimal for
problem B, even when A and B look almost identical (as fractional knapsack and 0/1 knapsack do)?

<details>
<summary>Answer</summary>

Greedy's optimality is a proven property of a SPECIFIC problem's structure (the greedy-choice
property), not a general fact about "greedy algorithms." Fractional knapsack allows taking a partial
item, which is exactly the flexibility the greedy-by-ratio proof depends on; the 0/1 constraint
removes that flexibility, and with it, the proof -- the two problems only look similar at the level
of "items, weights, values," not at the level of the structural property that actually makes greedy
work.

</details>

**W3.** Why does this topic insist Dijkstra's correctness be stated as conditional on non-negative
weights, rather than just "Dijkstra finds shortest paths"?

<details>
<summary>Answer</summary>

Because the unconditional claim is false -- Dijkstra's greedy strategy specifically depends on the
guarantee that once a node is popped with its currently-smallest distance, nothing later could ever
produce something smaller, and that guarantee only holds when every edge weight is non-negative.
Stating the assumption explicitly is what turns "use Dijkstra" from a habit into an engineering
decision that gets re-examined the moment a negative edge shows up (which is exactly why Bellman-Ford
exists as a fallback).

</details>

**W4.** Why do a plain BST and an AVL tree implement the SAME abstract operations (insert, search)
yet this topic treats them as fundamentally different structures, not just "an optimized BST"?

<details>
<summary>Answer</summary>

A plain BST's `O(log n)` bound is conditional -- it depends on insertion order happening to keep the
tree balanced, and degrades to `O(n)` on sorted input. An AVL tree's rotations make `O(log n)` height
a structural INVARIANT, true regardless of insertion order -- the difference isn't a performance
tweak, it's a difference between a probabilistic hope and a proven guarantee, which is a difference
in what you're actually allowed to claim about worst-case behavior.

</details>

**W5.** Why does this topic treat "amortized O(1)" as needing its own proof technique (co-02), rather
than just averaging the cost of a few observed operations?

<details>
<summary>Answer</summary>

Because amortized analysis is a WORST-CASE guarantee over any possible sequence of operations, not an
empirical average over some observed runs -- a doubling dynamic array's append IS worst-case `O(n)`
on the exact operation that triggers a resize, and the aggregate/accounting/potential methods are
what prove the AVERAGE cost across any sequence is still `O(1)`, regardless of which specific
sequence an adversary picks. An empirical average over sample runs proves nothing about a sequence
you haven't tried yet.

</details>

**W6.** Why does recognizing a problem as NP-hard change what "solving it" even means, compared to a
problem this topic solves with DP or a graph algorithm?

<details>
<summary>Answer</summary>

For a P problem, "solved" means an exact, polynomial-time algorithm exists and you should find it.
For an NP-hard problem, no such algorithm is known to exist (and is widely believed not to), so
"solved" has to mean something else: either an exact solution that's only feasible at small scale
(brute force), or a fast heuristic with no optimality guarantee. The choice between those two is
itself the practical skill -- treating an NP-hard problem as if it should have a clean polynomial
solution wastes effort looking for something that (very likely) isn't there.

</details>

**W7.** Why does a segment tree cost roughly `4x` the memory of a Fenwick tree to solve what looks
like the same prefix-sum problem?

<details>
<summary>Answer</summary>

A segment tree's generality (supporting any associative aggregate and efficient range updates via
lazy propagation) requires storing an explicit aggregate value at EVERY internal node of a full
binary tree over the array, plus lazy-propagation bookkeeping at each node -- a Fenwick tree exploits
the specific structure of prefix sums (via the lowest-set-bit indexing trick) to avoid storing that
much redundant state. The extra memory buys generality: co-05's tradeoff made explicit, paying more
space for a structure that solves a strictly larger class of problems.

</details>

**W8.** Why does backtracking's early-pruning discipline (co-25) matter more than it might seem,
given that both a pruned search and a brute-force enumeration are technically "exponential" in the
worst case?

<details>
<summary>Answer</summary>

"Exponential" describes an asymptotic upper bound, not the actual number of nodes visited on a
specific input -- pruning a branch the moment it violates a constraint means that branch's entire
remaining subtree, however large, is never explored at all. On real inputs (a mostly-solvable
Sudoku, a reasonably-sized N-Queens board), the difference between checking constraints only at the
end and checking them immediately after each placement is the difference between a search that
finishes in milliseconds and one that never finishes within any practical time bound, even though
both share the same worst-case big-O classification.

</details>

**W9.** Why does this topic build BOTH Kahn's algorithm and the DFS-based algorithm for topological
sort, rather than picking one as "the" standard approach?

<details>
<summary>Answer</summary>

They demonstrate the same result reachable via two structurally different mechanisms -- Kahn's is
fundamentally a greedy/BFS-flavored removal process (repeatedly peel off in-degree-zero nodes), while
the DFS-based approach is a byproduct of DFS finish-order (reverse post-order). Having both reinforces
that "a DAG has a linear order respecting every edge" is a property of the GRAPH, not an artifact of
one specific algorithm's traversal strategy -- and the two also detect cycles through entirely
different mechanisms (a short output vs. a back-edge), which is a useful cross-check when debugging.

</details>

**W10.** Why is a heap's relaxed ordering (correct at the root, unconstrained everywhere else)
described as a deliberate design choice rather than a limitation?

<details>
<summary>Answer</summary>

A FULLY sorted structure (like a balanced BST) would also give `O(log n)` access to the minimum, but
maintaining full order at every level costs more work per insertion than a heap's local parent-child
property requires. The heap property is the MINIMUM invariant needed to guarantee "the root is always
the extreme value" -- deliberately not maintaining any stronger ordering is exactly what keeps
push/pop at `O(log n)` instead of paying for a guarantee (full sortedness) that heap operations never
actually need.

</details>

---

← Previous: [Capstone](../learning/capstone/overview.md) · Next: [Advanced SQL & Query Performance Drilling](../../advanced-sql-and-query-performance/drilling/overview.md) →
