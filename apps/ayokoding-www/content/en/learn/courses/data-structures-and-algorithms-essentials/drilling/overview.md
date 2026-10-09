---
title: "Overview"
date: 2026-07-14T00:00:00+07:00
draft: false
weight: 1
---

This page is the active-recall companion to the Data Structures & Algorithms Essentials learning
track: four fixed drills that force retrieval instead of passive re-reading. Work through them in
order -- short-answer recall first, then scenario judgment, then hands-on implementation, then a
checklist to confirm real automaticity. Every answer is hidden in a `<details>` block; try each item
yourself, out loud or on paper, before opening it. Every prompt below uses its own mocked,
self-contained input -- none of it is copy-pasted from the learning track's 82 worked examples, so
recognizing an answer isn't enough; you have to actually reconstruct the reasoning.

## Recall Q&A

Twenty-two short-answer questions, one per concept (`co-01` through `co-22`). Answer from memory,
then check.

**Q1 (co-01 -- big-o-notation).** Name the five growth rates this topic uses repeatedly, from
cheapest to priciest, and give one concrete Python operation as an example of each.

<details>
<summary>Answer</summary>

O(1) constant (a `dict` lookup), O(log n) logarithmic (a complete binary search), O(n) linear (a
full list scan), O(n log n) linearithmic (`sorted()`/merge sort), and O(n²) quadratic (bubble
sort's nested loop). Big-O describes how cost scales with input size, independent of any one
machine's raw speed -- it says nothing about which of two same-order algorithms is faster in
absolute terms.

</details>

**Q2 (co-02 -- amortized-analysis).** `list.append()` is described as "amortized O(1)." What does
"amortized" mean here, and why doesn't the occasional expensive resize contradict the claim?

<details>
<summary>Answer</summary>

Amortized cost is the average cost per operation across a long sequence of calls, not the cost of
any single call in isolation. Most `.append()` calls are genuinely O(1) because there's spare
capacity in the backing array; occasionally the array is full and CPython allocates spare capacity
proportional to the new size, which can cost O(n) for that one call -- but those expensive steps
happen rarely enough that their cost, spread across the cheap calls between resizes,
averages out to O(1) per call.

</details>

**Q3 (co-03 -- dynamic-array).** Which single common operation on a Python list is O(n) even
though indexing and end-appending are both O(1), and why?

<details>
<summary>Answer</summary>

Inserting or deleting at the front (`list.insert(0, x)` or `list.pop(0)`) is O(n), because a list
is one contiguous block of memory -- removing or adding an element at position 0 forces every
remaining element to shift over by one slot to keep the array contiguous.

</details>

**Q4 (co-04 -- stack).** Which two list methods give O(1) stack push and pop with no dedicated
stack type needed, and why must they operate at the list's end, not its front?

<details>
<summary>Answer</summary>

`list.append()` (push) and `list.pop()` with no argument (pop). Both are O(1) precisely because
they operate at the list's end, where no other elements need to shift -- the same operations at
the front (`insert(0, ...)`/`pop(0)`) would cost O(n) for exactly the reason co-03 describes.

</details>

**Q5 (co-05 -- queue).** Why is a plain Python list a poor fit for a FIFO queue's dequeue
operation, and what stdlib type fixes it?

<details>
<summary>Answer</summary>

Dequeuing from the front of a list (`list.pop(0)`) is O(n), because every remaining element must
shift left by one. `collections.deque` fixes this with an O(1) `popleft()`, backed by a structure
purpose-built for O(1) operations at both ends.

</details>

**Q6 (co-06 -- deque).** Name all four O(1) operations `collections.deque` supports, and the two
simpler structures it generalizes.

<details>
<summary>Answer</summary>

`append` and `pop` at the right end, `appendleft` and `popleft` at the left end -- all four O(1).
It generalizes a stack (use only one end) and a queue (use both ends), which is why it's the
structure this topic reaches for whenever an algorithm needs cheap access at either boundary of a
sequence, such as a BFS frontier.

</details>

**Q7 (co-07 -- singly-linked-list).** Contrast a singly linked list's cost for head insertion and
for random access against a plain array's.

<details>
<summary>Answer</summary>

A linked list's head insertion is O(1) -- just relink one pointer, no shifting -- while an array's
front insertion is O(n) (co-03). But a linked list's random access (or traversal to a specific
position) is O(n), since you must walk node by node with no direct indexing, while an array's
indexing is O(1). Each structure trades the opposite operation's cost for the other's cheapness.

</details>

**Q8 (co-08 -- hash-map).** What ordering guarantee does a Python `dict` make, since which
version, and how is that different from key-sortedness?

<details>
<summary>Answer</summary>

Since Python 3.7, `dict` guarantees insertion-order iteration as a language-specification
guarantee, not just a CPython implementation detail -- keys are always visited in the order they
were first set, and updating an existing key's value never moves its position. That's entirely
different from being key-sorted (like a BST): a `dict` with keys inserted as `3, 1, 2` iterates
`3, 1, 2`, not `1, 2, 3`.

</details>

**Q9 (co-09 -- hash-set).** When does a `set`'s membership test beat a list's, and by how much on
average?

<details>
<summary>Answer</summary>

Whenever the recurring question is "have I already seen this value?" -- deduplication,
visited-node tracking in a graph traversal, or checking for a repeated character in a sliding
window. A `set`'s `in` check is O(1) average; the same check against a list is O(n), since a list
has to be scanned element by element with no shortcut.

</details>

**Q10 (co-10 -- binary-tree).** Name all four binary tree traversal orders, and say which are
depth-first and which is breadth-first.

<details>
<summary>Answer</summary>

Preorder (node, left, right), inorder (left, node, right), and postorder (left, right, node) are
all depth-first. Level-order -- visiting level by level using a queue -- is breadth-first. The
three depth-first orders differ only in when the current node itself gets visited relative to its
two subtrees.

</details>

**Q11 (co-11 -- binary-search-tree).** State the BST invariant from memory, and explain exactly
why it makes an inorder traversal yield sorted output.

<details>
<summary>Answer</summary>

Every node's left subtree holds only smaller values, and its right subtree holds only larger
values. Inorder traversal visits the left subtree, then the node, then the right subtree --
because the invariant guarantees everything in the left subtree is smaller and everything in the
right subtree is larger, visiting in that exact order necessarily produces ascending sorted order,
recursively, at every level of the tree.

</details>

**Q12 (co-12 -- heap-priority-queue).** Does Python's `heapq` give you a min-heap or a max-heap by
default, and how do you get the opposite behavior out of it?

<details>
<summary>Answer</summary>

The original `heapq` operations implement a min-heap -- the smallest element is at the root and pops
first. Python 3.14 adds dedicated max-heap operations. To simulate a max-heap on Python 3.10+,
negate every value on the way in (`heappush(heap, -value)`) and negate it back on the way out
(`-heappop(heap)`) -- the smallest negated value corresponds to the largest original value.

</details>

**Q13 (co-13 -- linear-search).** For one search through an unsorted list with no index or
preprocessing, why might you need to inspect every element?

<details>
<summary>Answer</summary>

The list gives no ordering clue or separate lookup structure, so a target could be at the last
position or absent: a scan takes O(n) in the worst case. For repeated membership queries, build a
`set` or `dict` index once and then use average-O(1) lookups; if the data is sorted, binary search
can use O(log n) comparisons.

</details>

**Q14 (co-14 -- binary-search).** What precondition does binary search require that linear search
does not, and what complexity does satisfying it buy you?

<details>
<summary>Answer</summary>

The data must already be sorted. Given that precondition, binary search halves the remaining
search range on every comparison, giving O(log n) instead of linear search's O(n) -- on a
million-element sorted list, that's roughly 20 comparisons instead of up to a million.

</details>

**Q15 (co-15 -- builtin-sort).** What algorithm powers `sorted()`/`list.sort()`, what's its
complexity, and what does "stable" guarantee?

<details>
<summary>Answer</summary>

Timsort, a stable, O(n log n) hybrid sort. Stability means elements that compare equal keep their
original relative order after sorting -- which is exactly what makes sorting by a tuple key
(primary field, then secondary field) reliably produce a correct multi-key sort: the secondary
sort's tie order survives the primary sort untouched.

</details>

**Q16 (co-16 -- comparison-sorts).** Which classic comparison sort is the only one with a
guaranteed O(n log n) _worst case_, and how do bubble, insertion, selection, and quicksort each
differ from it?

<details>
<summary>Answer</summary>

Merge sort guarantees O(n log n) even in the worst case, because it always splits the input in
half regardless of its current order. Bubble, insertion, and selection sort are all O(n²) in the
general case. Quicksort is O(n log n) on average, but degrades to O(n²) in the worst case with a
poorly chosen pivot -- for example, already-sorted input paired with a naive first-element pivot.

</details>

**Q17 (co-17 -- recursion).** Name the two things every correct recursive function needs, and what
resource each call consumes that isn't reclaimed until that call returns.

<details>
<summary>Answer</summary>

A base case (where the recursion stops) and a recursive case (where it calls itself on a smaller
input). Each call consumes one call-stack frame, which stays allocated -- and unavailable for
anything else -- until that specific call returns.

</details>

**Q18 (co-18 -- iterate-vs-recurse).** What ceiling does deep recursion eventually hit in Python,
and what's the general strategy for avoiding it?

<details>
<summary>Answer</summary>

`RecursionError` (a `RuntimeError` subclass since Python 3.5), raised once the call stack exceeds
`sys.getrecursionlimit()` (typically 1000). The general strategy is rewriting the algorithm
iteratively -- often with an explicit stack replacing the implicit call stack -- so stack usage no
longer grows with input depth.

</details>

**Q19 (co-19 -- memoization).** What complexity class does naive recursive Fibonacci belong to,
and what does adding a cache collapse it to?

<details>
<summary>Answer</summary>

Exponential, because overlapping subproblems (like `fib(n-2)`) get recomputed from scratch every
time they're needed again. Caching each unique subproblem's result -- in a `dict` or via
`functools.lru_cache` -- collapses that to linear time, with zero change to the recursive logic
itself.

</details>

**Q20 (co-20 -- two-pointer-and-sliding-window).** What complexity do two-pointer and
sliding-window techniques typically replace an O(n²) nested scan with, and what's the general
shape of the trick?

<details>
<summary>Answer</summary>

O(n), a single pass. The trick is coordinating two indices (or a moving window's edges) that only
ever move forward, never backward -- which is what lets a problem that looks like it needs
every-pair comparison collapse into one linear sweep instead.

</details>

**Q21 (co-21 -- graph-adjacency).** What structure represents a graph in this topic, and which
traversal -- BFS or DFS -- finds shortest-path length in an unweighted graph, and why that one?

<details>
<summary>Answer</summary>

A dict-of-lists adjacency map: each key is a node, its value the list of neighbors. BFS finds
unweighted shortest-path length, because its queue-driven, level-by-level exploration guarantees
every node is first reached via the fewest possible edges -- DFS explores as deep as possible
first and gives no such guarantee.

</details>

**Q22 (co-22 -- static-type-hints).** Do Python type hints change what a program does at runtime?
What actually checks them?

<details>
<summary>Answer</summary>

No -- type hints are pure documentation as far as `python3` itself is concerned; nothing about
`def f(x: int)` stops you from calling `f("a string")` at runtime. A separate static type checker
(like `pyright` or `mypy`) reads the hints and reports mismatches without ever running the code.

</details>

## Applied problems

Fourteen scenarios spanning beginner through advanced material. Each describes a realistic
engineering situation without naming the data structure or algorithm -- decide which one solves it
and why, then check your reasoning against the worked solution.

**AP1.** You maintain an in-memory index of 100,000 user records keyed by a unique user ID, and
the hot path is "look up a user's profile by ID," running thousands of times per second. Which
structure do you reach for, and what would it cost if you'd used a plain list of records instead?

<details>
<summary>Worked solution</summary>

A `dict` keyed by user ID -- average-O(1) lookup regardless of how many records exist. A plain
list of records would force an O(n) scan per lookup (checking each record's ID field one at a
time); at 100,000 records that's the difference between one hash computation and, on average,
scanning half the list every single time (co-08, contrasted with co-13).

</details>

**AP2.** A print queue must process jobs in the exact order they arrived, and jobs are added and
removed constantly under load, with additions at one end and removals at the other happening at
high frequency. Which structure, and why not a plain list?

<details>
<summary>Worked solution</summary>

A `deque`, appending new jobs at the back and popping from the front with `popleft()` -- both
O(1). A plain list would make dequeuing O(n) via `pop(0)`, since every remaining job would have to
shift left on every single removal (co-05, co-06).

</details>

**AP3.** A text editor needs an unlimited "undo" feature: the very next action to undo must always
be the very last action performed. Which structure?

<details>
<summary>Worked solution</summary>

A stack, implemented with `list.append()`/`list.pop()`. LIFO order maps exactly onto "the most
recent action is the first one undone" -- no other structure's default ordering matches that
requirement as directly (co-04).

</details>

**AP4.** A streaming pipeline ingests millions of event IDs and must silently drop any event ID it
has already processed, at high throughput. What structure keeps the "have I seen this" check
cheap?

<details>
<summary>Worked solution</summary>

A `set` -- O(1) average membership testing. A list would degrade to O(n) per check, which is
untenable once the pipeline has processed even a few thousand distinct IDs, let alone millions
(co-09).

</details>

**AP5.** A live dashboard must always display the 5 highest-scoring players out of a
constantly-updating stream of thousands of scores per second, without re-sorting the entire stream
on every single update.

<details>
<summary>Worked solution</summary>

A size-bounded min-heap holding the current top 5: push each new score, and whenever the heap's
size exceeds 5, pop the minimum. That's O(log 5) per update instead of an O(n log n) re-sort of the
whole running history -- the heap's smallest element sitting at the root is exactly what a new
score gets compared against for possible eviction (co-12).

</details>

**AP6.** Log timestamps are already held in a sorted, in-memory list, and you need to find whether
a specific timestamp exists among millions of entries without scanning one by one.

<details>
<summary>Worked solution</summary>

Binary search (or `bisect` on that list) -- O(log n) comparisons instead of a linear scan's O(n).
Sortedness lets you discard half the remaining range each step. If the list were unsorted and you
needed only one query, a scan could be simpler; for repeated queries, a `set` index is another
option (co-14, co-08).

</details>

**AP7.** Given a sorted list of refund amounts, find two amounts that sum exactly to a target
refund total, without a nested double loop.

<details>
<summary>Worked solution</summary>

The two-pointer technique: one pointer at each end of the sorted list, moving inward based on
whether the current pair's sum is too high (move the right pointer left) or too low (move the left
pointer right). That's O(n), a single pass, instead of O(n²) checking every possible pair (co-20,
built on the sortedness co-14 relies on).

</details>

**AP8.** A build system has a set of tasks with dependencies ("task B can't run until task A
finishes") and needs to emit a valid execution order -- or detect that no valid order exists
because of a circular dependency.

<details>
<summary>Worked solution</summary>

Topological sort (Kahn's algorithm: in-degree counting plus a queue) for the ordering. Cycle
detection falls out of the same underlying structure: a genuine DAG always fully empties Kahn's
queue and produces an order covering every node, while a cyclic graph leaves at least one node
permanently stuck at in-degree greater than zero -- or, using the DFS-coloring approach directly,
a back-edge to a node still "in progress" on the current path (co-21, co-05, co-08).

</details>

**AP9.** A delivery-routing service needs the cheapest route between two warehouses on a road
network where each road segment has a different, nonnegative travel cost -- not every edge is equally
cheap.

<details>
<summary>Worked solution</summary>

Dijkstra's algorithm with a min-heap: with nonnegative edge weights, always expand the
currently-cheapest-known frontier node next. Plain unweighted BFS would treat every edge as equally
costly and give the wrong answer the moment edge weights differ from one another (co-12, co-21).

</details>

**AP10.** You need the median transaction amount out of a huge unsorted batch, repeatedly, but
don't want to pay the full O(n log n) cost of sorting the entire batch just to read off one middle
value each time.

<details>
<summary>Worked solution</summary>

Quickselect: it partitions like quicksort, but only recurses into the single half that contains
the target index, discarding the other half entirely instead of continuing to sort it. That gives
average O(n) instead of a full O(n log n) sort (co-16).

</details>

**AP11.** A search bar needs to autocomplete partial words as the user types, checking "does any
word in the dictionary start with this prefix" on every keystroke, against a dictionary of
hundreds of thousands of words.

<details>
<summary>Worked solution</summary>

A prefix trie -- each keystroke walks one more level down an existing dict-of-children structure
in O(prefix length), independent of how many words the dictionary holds. A plain list of words
would need an O(n) scan (or an O(n log n) sorted-prefix search) on every single keystroke (co-08,
co-10).

</details>

**AP12.** A recursive function computing grid-path counts (or Fibonacci-style overlapping
subproblems) is timing out on modest inputs because it recomputes the same subproblem thousands of
times.

<details>
<summary>Worked solution</summary>

Memoization -- cache each unique subproblem's result in a `dict`, or via `functools.lru_cache`,
collapsing exponential recomputation into linear work with no change to the recursive logic itself
(co-19, built directly on co-17).

</details>

**AP13.** An in-memory cache can only hold a fixed number of entries, and when it's full, the
least-recently-accessed entry (not the oldest-inserted one) should be evicted first, with both
reads and writes needing to stay fast under load.

<details>
<summary>Worked solution</summary>

An LRU cache built from a `dict` (O(1) key lookup) plus a doubly linked list (O(1) reordering to
the front on every access, and O(1) removal of whichever node sits at the tail). Neither structure
alone gives O(1) for both operations -- the dict alone has no notion of recency order, and a linked
list alone has no O(1) keyed lookup (co-08, co-07).

</details>

**AP14.** You need the length of the longest run of a sensor's readings with no duplicate value
repeated within that run, scanning the reading stream exactly once.

<details>
<summary>Worked solution</summary>

A sliding window tracked with a `set`: expand the window's right edge, and whenever the incoming
value is already inside the window's set, shrink from the left until it isn't. That's O(n), a
single pass, instead of checking every possible substring/subrange individually (co-20, co-09).

</details>

## Code katas

Twenty-two hands-on implementation drills, spanning beginner structures through the topic's
hardest advanced-tier algorithms. Each is a self-contained, runnable `.py` snippet: implement the
task yourself first, then compare against the reference solution and the actually-verified output
shown.

### Kata 1 -- Balanced brackets with a stack

**Task.** Implement `is_balanced(s: str) -> bool`, returning `True` only when every `(`, `[`, `{`
in `s` has a matching, correctly nested closing bracket. (co-04)

<details>
<summary>Reference solution</summary>

```python
def is_balanced(s: str) -> bool:  # => co-04: a stack tracks "most recently opened, not yet closed"
    pairs: dict[str, str] = {")": "(", "]": "[", "}": "{"}  # => closing -> matching opening
    stack: list[str] = []  # => list.append/list.pop as the stack (O(1) at both push and pop)
    for ch in s:  # => a single O(n) pass over the string
        if ch in "([{":  # => an opener -- push it, we'll need to match it against a later closer
            stack.append(ch)  # => O(1) push
        elif ch in pairs:  # => a closer -- must match whatever is on TOP of the stack right now
            if not stack or stack.pop() != pairs[ch]:  # => empty stack, or closes the wrong opener
                return False  # => nothing to close, or closes the wrong opener entirely
    return not stack  # => True only if every opener found its closer (stack fully drained)


print(is_balanced("{[()()]}"))  # => Output: True
print(is_balanced("{[(])}"))  # => Output: False -- the ] closes ( instead of the nearer [

assert is_balanced("{[()()]}") is True
assert is_balanced("{[(])}") is False
assert is_balanced("(") is False  # => an opener with no matching closer at all
print("kata-01 OK")
```

**Run**: `python3 kata.py`

**Output**:

```text
True
False
kata-01 OK
```

</details>

### Kata 2 -- FIFO queue with `collections.deque`

**Task.** Implement a `PrintQueue` class with `enqueue(job: str) -> None` and
`dequeue() -> str`, backed by `collections.deque`, and prove FIFO order on three jobs. (co-05,
co-06)

<details>
<summary>Reference solution</summary>

```python
from collections import deque


class PrintQueue:  # => co-05/co-06: FIFO order, O(1) at both ends via deque
    def __init__(self) -> None:
        self._jobs: deque[str] = deque()  # => O(1) append/popleft, unlike a list's O(n) pop(0)

    def enqueue(self, job: str) -> None:  # => O(1): add to the back
        self._jobs.append(job)

    def dequeue(self) -> str:  # => O(1): remove from the front -- the OLDEST queued job
        return self._jobs.popleft()


queue = PrintQueue()
queue.enqueue("report.pdf")  # => back: [report.pdf]
queue.enqueue("invoice.pdf")  # => back: [report.pdf, invoice.pdf]
queue.enqueue("label.pdf")  # => back: [report.pdf, invoice.pdf, label.pdf]

first = queue.dequeue()  # => removes from the FRONT -- the first job enqueued
second = queue.dequeue()  # => removes the next-oldest job
print(first, second)  # => Output: report.pdf invoice.pdf

assert first == "report.pdf"  # => confirms FIFO: first enqueued, first served
assert second == "invoice.pdf"
print("kata-02 OK")
```

**Run**: `python3 kata.py`

**Output**:

```text
report.pdf invoice.pdf
kata-02 OK
```

</details>

### Kata 3 -- Iterative binary search

**Task.** Implement `binary_search(nums: list[int], target: int) -> int`, returning the index of
`target` in a sorted list, or `-1` if absent, without recursion. (co-14)

<details>
<summary>Reference solution</summary>

```python
def binary_search(nums: list[int], target: int) -> int:  # => co-14: sorted precondition -> O(log n)
    low, high = 0, len(nums) - 1  # => the current search range, inclusive on both ends
    while low <= high:  # => shrink the range every iteration until it's empty
        mid = (low + high) // 2  # => the midpoint of the current range
        if nums[mid] == target:  # => found it
            return mid  # => O(1) once located
        if nums[mid] < target:  # => target must be in the RIGHT half
            low = mid + 1  # => discard the left half entirely, including mid
        else:  # => target must be in the LEFT half
            high = mid - 1  # => discard the right half entirely, including mid
    return -1  # => range emptied without a match -- target is absent


data = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]  # => 10 sorted values
found = binary_search(data, 23)  # => 23 sits at index 5
missing = binary_search(data, 24)  # => 24 is not in data at all
print(found, missing)  # => Output: 5 -1

assert found == 5
assert missing == -1
print("kata-03 OK")
```

**Run**: `python3 kata.py`

**Output**:

```text
5 -1
kata-03 OK
```

</details>

### Kata 4 -- Recursive merge sort

**Task.** Implement `merge_sort(nums: list[int]) -> list[int]` recursively, and verify it matches
`sorted()`. (co-16, co-17)

<details>
<summary>Reference solution</summary>

```python
def merge_sort(nums: list[int]) -> list[int]:  # => co-16/co-17: divide, recurse, then combine
    if len(nums) <= 1:  # => base case: a list of 0 or 1 elements is already sorted
        return nums
    mid = len(nums) // 2  # => split point
    left = merge_sort(nums[:mid])  # => recursively sort the left half
    right = merge_sort(nums[mid:])  # => recursively sort the right half
    return _merge(left, right)  # => combine two already-sorted halves in O(n)


def _merge(left: list[int], right: list[int]) -> list[int]:  # => merges two sorted lists into one
    result: list[int] = []  # => the merged, sorted output
    i = j = 0  # => cursors into left and right respectively
    while i < len(left) and j < len(right):  # => walk both lists in lockstep
        if left[i] <= right[j]:  # => left's current element is smaller-or-equal -- a stable choice
            result.append(left[i])  # => take from left
            i += 1
        else:
            result.append(right[j])  # => take from right
            j += 1
    result.extend(left[i:])  # => append whatever's left over on the left side (already sorted)
    result.extend(right[j:])  # => append whatever's left over on the right side (already sorted)
    return result


data = [9, 3, 7, 1, 8, 2, 5]
sorted_data = merge_sort(data)
print(sorted_data)  # => Output: [1, 2, 3, 5, 7, 8, 9]

assert sorted_data == sorted(data)  # => cross-checks against the built-in sort
print("kata-04 OK")
```

**Run**: `python3 kata.py`

**Output**:

```text
[1, 2, 3, 5, 7, 8, 9]
kata-04 OK
```

</details>

### Kata 5 -- Recursive quicksort

**Task.** Implement `quicksort(nums: list[int]) -> list[int]` (returning a new sorted list) with a
middle-element pivot, and verify against `sorted()`. (co-16, co-17)

<details>
<summary>Reference solution</summary>

```python
def quicksort(nums: list[int]) -> list[int]:  # => co-16/co-17: partition around a pivot, recurse
    if len(nums) <= 1:  # => base case: 0 or 1 elements is already sorted
        return nums
    pivot = nums[len(nums) // 2]  # => a middle-element pivot (avoids worst-case on sorted input)
    less = [n for n in nums if n < pivot]  # => everything smaller than pivot
    equal = [n for n in nums if n == pivot]  # => every occurrence of the pivot value itself
    greater = [n for n in nums if n > pivot]  # => everything larger than pivot
    return quicksort(less) + equal + quicksort(greater)  # => sort each partition, then concatenate


data = [5, 1, 9, 4, 6, 2, 8]
sorted_data = quicksort(data)
print(sorted_data)  # => Output: [1, 2, 4, 5, 6, 8, 9]

assert sorted_data == sorted(data)
print("kata-05 OK")
```

**Run**: `python3 kata.py`

**Output**:

```text
[1, 2, 4, 5, 6, 8, 9]
kata-05 OK
```

</details>

### Kata 6 -- Reverse a singly linked list

**Task.** Given a `Node` class (`val`, `next`), implement `reverse(head: Node | None) -> Node |
None` iteratively, in O(1) extra space. (co-07)

<details>
<summary>Reference solution</summary>

```python
from __future__ import annotations


class Node:  # => co-07: a node-based sequence
    def __init__(self, val: int, next: Node | None = None) -> None:
        self.val = val
        self.next = next


def reverse(head: Node | None) -> Node | None:  # => O(n) time, O(1) extra space
    prev: Node | None = None  # => builds the new (reversed) list one link at a time
    curr = head  # => walks the original list
    while curr is not None:  # => visits every node exactly once
        next_node = curr.next  # => save curr's original next BEFORE it gets overwritten
        curr.next = prev  # => flip the pointer: curr now points BACKWARD
        prev = curr  # => prev advances to curr
        curr = next_node  # => curr advances to the saved original next
    return prev  # => prev ends up as the new head, once curr runs off the end


head = Node(1, Node(2, Node(3, Node(4))))  # => 1 -> 2 -> 3 -> 4
new_head = reverse(head)  # => reverses in place, O(1) extra space

values: list[int] = []  # => collects the reversed order for verification
node = new_head
while node is not None:
    values.append(node.val)
    node = node.next
print(values)  # => Output: [4, 3, 2, 1]

assert values == [4, 3, 2, 1]
print("kata-06 OK")
```

**Run**: `python3 kata.py`

**Output**:

```text
[4, 3, 2, 1]
kata-06 OK
```

</details>

### Kata 7 -- Find the middle node with slow/fast pointers

**Task.** Implement `find_middle(head: Node) -> Node` for a singly linked list, in a single pass,
using two pointers moving at different speeds. (co-07, co-20)

<details>
<summary>Reference solution</summary>

```python
from __future__ import annotations


class Node:  # => co-07: a node-based sequence
    def __init__(self, val: int, next: Node | None = None) -> None:
        self.val = val
        self.next = next


def find_middle(head: Node) -> Node:  # => co-07/co-20: two pointers, one pass, no length() call
    slow = fast = head  # => both start at the head
    while fast.next is not None and fast.next.next is not None:  # => fast still has 2 more hops
        assert slow is not None  # => invariant: slow never runs past fast, so it's always live here
        slow = slow.next  # => slow advances one node
        fast = fast.next.next  # => fast moves twice as fast as slow
    assert slow is not None  # => the list is non-empty in this example
    return slow  # => once fast nears the end, slow sits exactly at the middle


head = Node(1, Node(2, Node(3, Node(4, Node(5)))))  # => 1 -> 2 -> 3 -> 4 -> 5 (odd length)
middle = find_middle(head)
print(middle.val)  # => Output: 3

assert middle.val == 3  # => the true middle of a 5-node list
print("kata-07 OK")
```

**Run**: `python3 kata.py`

**Output**:

```text
3
kata-07 OK
```

</details>

### Kata 8 -- Min-heap priority queue

**Task.** Implement `process_by_priority(tasks: list[tuple[int, str]]) -> list[str]`, popping
tasks in ascending-priority order using `heapq`, where lower numbers run first. (co-12)

<details>
<summary>Reference solution</summary>

```python
import heapq


def process_by_priority(tasks: list[tuple[int, str]]) -> list[str]:  # => co-12: min-heap order
    heap: list[tuple[int, str]] = []  # => heapq keeps this list heap-ordered by the FIRST tuple field
    for priority, name in tasks:  # => push every task once -- O(log n) each
        heapq.heappush(heap, (priority, name))
    order: list[str] = []  # => the order tasks would actually run in
    while heap:  # => pop the lowest-priority-number task each time -- O(log n) each
        _, name = heapq.heappop(heap)  # => always the current minimum by (priority, name)
        order.append(name)
    return order


tasks = [(3, "cleanup"), (1, "deploy"), (2, "test"), (1, "backup")]  # => two tasks tie at priority 1
result = process_by_priority(tasks)
print(result)  # => Output: ['backup', 'deploy', 'test', 'cleanup']
# => the priority-1 tie breaks by the SECOND tuple field (task name), alphabetically -- heapq
# => compares tuples lexicographically, so "backup" < "deploy" settles the tie

assert result == ["backup", "deploy", "test", "cleanup"]
print("kata-08 OK")
```

**Run**: `python3 kata.py`

**Output**:

```text
['backup', 'deploy', 'test', 'cleanup']
kata-08 OK
```

</details>

### Kata 9 -- BST insert and inorder traversal

**Task.** Implement a BST with `insert(root, val) -> TreeNode` and `inorder(root) -> list[int]`,
and confirm that inserting `[5, 3, 8, 1, 4, 7, 9]` in that order still yields a sorted inorder
traversal. (co-10, co-11)

<details>
<summary>Reference solution</summary>

```python
from __future__ import annotations


class TreeNode:  # => co-10/co-11: a node with up to two children, ordered left < node < right
    def __init__(self, val: int) -> None:
        self.val = val
        self.left: TreeNode | None = None
        self.right: TreeNode | None = None


def insert(root: TreeNode | None, val: int) -> TreeNode:  # => average O(log n) on a balanced tree
    if root is None:  # => base case: an empty subtree -- val becomes a new leaf right here
        return TreeNode(val)
    if val < root.val:  # => smaller values always go left (the BST invariant)
        root.left = insert(root.left, val)  # => recurse into the left subtree
    else:  # => equal-or-larger values always go right
        root.right = insert(root.right, val)  # => recurse into the right subtree
    return root  # => the (possibly unchanged) subtree root, for the caller to re-link


def inorder(root: TreeNode | None) -> list[int]:  # => left, node, right -- yields SORTED order
    if root is None:  # => base case: nothing to visit
        return []
    return inorder(root.left) + [root.val] + inorder(root.right)  # => co-11's core invariant


root: TreeNode | None = None
for value in [5, 3, 8, 1, 4, 7, 9]:  # => insert in this exact, unsorted order
    root = insert(root, value)

result = inorder(root)
print(result)  # => Output: [1, 3, 4, 5, 7, 8, 9]

assert result == sorted([5, 3, 8, 1, 4, 7, 9])  # => inorder ALWAYS yields sorted order on a BST
print("kata-09 OK")
```

**Run**: `python3 kata.py`

**Output**:

```text
[1, 3, 4, 5, 7, 8, 9]
kata-09 OK
```

</details>

### Kata 10 -- BFS over a graph

**Task.** Implement `bfs(graph: dict[str, list[str]], start: str) -> list[str]`, returning nodes
in visit order, on a 5-node graph. (co-21, co-05, co-09)

<details>
<summary>Reference solution</summary>

```python
from collections import deque


def bfs(graph: dict[str, list[str]], start: str) -> list[str]:  # => co-21/co-05: level by level
    visited: set[str] = {start}  # => co-09: tracks "already queued" to avoid infinite loops
    order: list[str] = []  # => the order nodes are actually VISITED (popped), not just queued
    frontier: deque[str] = deque([start])  # => co-06: FIFO frontier -- what makes BFS breadth-first
    while frontier:  # => O(V + E) overall -- every node and edge visited at most once
        node = frontier.popleft()  # => O(1): the oldest-queued, not-yet-visited node
        order.append(node)
        for neighbor in graph[node]:  # => check every outgoing edge from node
            if neighbor not in visited:  # => O(1) average set check -- skip already-seen nodes
                visited.add(neighbor)  # => mark BEFORE queuing, to avoid duplicate queue entries
                frontier.append(neighbor)  # => queue it for a LATER level
    return order


graph: dict[str, list[str]] = {
    "a": ["b", "c"],
    "b": ["a", "d"],
    "c": ["a", "d"],
    "d": ["b", "c", "e"],
    "e": ["d"],
}
result = bfs(graph, "a")
print(result)  # => Output: ['a', 'b', 'c', 'd', 'e']

assert result == ["a", "b", "c", "d", "e"]
print("kata-10 OK")
```

**Run**: `python3 kata.py`

**Output**:

```text
['a', 'b', 'c', 'd', 'e']
kata-10 OK
```

</details>

### Kata 11 -- DFS over a graph

**Task.** Implement `dfs(graph: dict[str, list[str]], start: str) -> list[str]` recursively, on
the same graph shape used in Kata 10, and observe how the visit order differs from BFS. (co-21,
co-17, co-09)

<details>
<summary>Reference solution</summary>

```python
def dfs(graph: dict[str, list[str]], start: str) -> list[str]:  # => co-21/co-17: as deep as possible first
    visited: set[str] = set()  # => co-09: tracks visited nodes across the whole recursion
    order: list[str] = []  # => the order nodes are actually visited

    def _visit(node: str) -> None:  # => inner recursive helper, closes over visited and order
        visited.add(node)  # => mark BEFORE recursing, to avoid revisiting on a cycle
        order.append(node)
        for neighbor in graph[node]:  # => explore each neighbor
            if neighbor not in visited:  # => O(1) average check
                _visit(neighbor)  # => recurse -- goes AS DEEP as possible before backtracking

    _visit(start)
    return order


graph: dict[str, list[str]] = {
    "a": ["b", "c"],
    "b": ["a", "d"],
    "c": ["a", "d"],
    "d": ["b", "c", "e"],
    "e": ["d"],
}
result = dfs(graph, "a")
print(result)  # => Output: ['a', 'b', 'd', 'c', 'e']

assert result == ["a", "b", "d", "c", "e"]
print("kata-11 OK")
```

**Run**: `python3 kata.py`

**Output**:

```text
['a', 'b', 'd', 'c', 'e']
kata-11 OK
```

</details>

### Kata 12 -- Memoized Fibonacci with a dict cache

**Task.** Implement `fib_naive` (plain recursion) and `fib_memo` (dict-cached), count how many
times each actually runs, and confirm they agree while the call counts diverge sharply. (co-19,
co-08, co-17)

<details>
<summary>Reference solution</summary>

```python
call_count_naive = 0


def fib_naive(n: int) -> int:  # => co-17: naive recursion -- recomputes overlapping subproblems
    global call_count_naive
    call_count_naive += 1  # => tracks how many times this function actually runs
    if n <= 1:  # => base case
        return n
    return fib_naive(n - 1) + fib_naive(n - 2)  # => recomputes fib(n-2) again inside fib(n-1)'s call


call_count_memo = 0


def fib_memo(n: int, cache: dict[int, int]) -> int:  # => co-19: a dict cache collapses the recomputation
    global call_count_memo
    call_count_memo += 1
    if n in cache:  # => O(1) average -- this exact subproblem was already solved
        return cache[n]  # => reuse the stored answer instead of recomputing
    if n <= 1:  # => base case
        result = n
    else:
        result = fib_memo(n - 1, cache) + fib_memo(n - 2, cache)  # => still recursive, but cached
    cache[n] = result  # => store BEFORE returning, so future calls hit the cache
    return result


naive_result = fib_naive(20)
memo_result = fib_memo(20, {})
print(naive_result, memo_result)  # => Output: 6765 6765
print(call_count_naive, call_count_memo)  # => Output: 21891 39 -- exponential vs linear call growth

assert naive_result == memo_result == 6765  # => both compute the identical correct answer
assert call_count_memo < call_count_naive  # => memoization drastically cuts the call count
print("kata-12 OK")
```

**Run**: `python3 kata.py`

**Output**:

```text
6765 6765
21891 39
kata-12 OK
```

</details>

### Kata 13 -- Dijkstra's shortest paths

**Task.** Implement `dijkstra(graph: dict[str, list[tuple[str, int]]], start: str) -> dict[str,
int]` using a min-heap, on a small graph with nonnegative weights. Reject negative edge weights
with a clear error before the search. (co-12, co-21)

<details>
<summary>Reference solution</summary>

```python
import heapq


def dijkstra(graph: dict[str, list[tuple[str, int]]], start: str) -> dict[str, int]:  # => co-12/co-21
    for edges in graph.values():  # => validate every edge before shortest-path search
        for _, weight in edges:  # => O(E) precondition check
            if weight < 0:  # => Dijkstra cannot finalize distances with negative weights
                raise ValueError("Dijkstra requires nonnegative edge weights")
    distances: dict[str, int] = {start: 0}  # => best known distance so far -- start is 0 by definition
    heap: list[tuple[int, str]] = [(0, start)]  # => (distance, node) -- heapq orders by distance first
    while heap:  # => O((V + E) log V) overall
        dist, node = heapq.heappop(heap)  # => always the cheapest unexpanded frontier entry
        if dist > distances.get(node, float("inf")):  # => a stale entry -- a better path already won
            continue  # => skip it without re-processing
        for neighbor, weight in graph[node]:  # => relax every outgoing edge from node
            new_dist = dist + weight  # => candidate cost of reaching neighbor THROUGH node
            if new_dist < distances.get(neighbor, float("inf")):  # => strictly cheaper than known
                distances[neighbor] = new_dist  # => record the improvement
                heapq.heappush(heap, (new_dist, neighbor))  # => push the improved candidate

    return distances


graph: dict[str, list[tuple[str, int]]] = {
    "s": [("a", 2), ("b", 5)],
    "a": [("b", 1), ("c", 4)],
    "b": [("c", 1)],
    "c": [],
}
result = dijkstra(graph, "s")
print(result)  # => Output: {'s': 0, 'a': 2, 'b': 3, 'c': 4}
# => s->a->b (2+1=3) beats the direct s->b edge (5); s->a->b->c (2+1+1=4) beats s->a->c (2+4=6)

assert result == {"s": 0, "a": 2, "b": 3, "c": 4}
try:  # => negative weights are outside the algorithm's supported input
    dijkstra({"s": [("a", -1)], "a": []}, "s")
except ValueError as exc:  # => reject with a deterministic explanation
    assert str(exc) == "Dijkstra requires nonnegative edge weights"
else:  # => never silently accept an invalid weighted graph
    raise AssertionError("negative edge weight was accepted")
print("kata-13 OK")
```

**Run**: `python3 kata.py`

**Output**:

```text
{'s': 0, 'a': 2, 'b': 3, 'c': 4}
kata-13 OK
```

</details>

### Kata 14 -- Topological sort via Kahn's algorithm

**Task.** Implement `topological_sort(graph: dict[str, list[str]]) -> list[str]` using in-degree
counting plus a queue, on a small build-dependency DAG. (co-21, co-05, co-08)

<details>
<summary>Reference solution</summary>

```python
from collections import deque


def topological_sort(graph: dict[str, list[str]]) -> list[str]:  # => co-21/co-05/co-08
    in_degree: dict[str, int] = {node: 0 for node in graph}  # => every node starts at 0 dependents-in
    for node in graph:  # => O(V + E): count how many edges point INTO each node
        for neighbor in graph[node]:  # => node -> neighbor means "node must come before neighbor"
            in_degree[neighbor] += 1  # => neighbor now has one more prerequisite counted

    queue: deque[str] = deque(  # => co-06: FIFO frontier of nodes with NO remaining prerequisites
        node for node in graph if in_degree[node] == 0  # => every node ready to run right now
    )
    order: list[str] = []  # => the emitted, valid execution order
    while queue:  # => O(V + E) overall -- every node dequeued once, every edge relaxed once
        node = queue.popleft()  # => O(1): the next node with zero remaining prerequisites
        order.append(node)
        for neighbor in graph[node]:  # => node is done -- neighbor has one fewer prerequisite now
            in_degree[neighbor] -= 1  # => "remove" this satisfied dependency
            if in_degree[neighbor] == 0:  # => neighbor's LAST prerequisite just cleared
                queue.append(neighbor)  # => neighbor is now ready too

    return order  # => a valid order IFF len(order) == len(graph); a shorter list means a cycle


graph: dict[str, list[str]] = {
    "fetch_deps": ["compile"],
    "compile": ["link"],
    "link": ["test"],
    "test": [],
}
result = topological_sort(graph)
print(result)  # => Output: ['fetch_deps', 'compile', 'link', 'test']

assert result == ["fetch_deps", "compile", "link", "test"]  # => a single valid chain has one order
assert len(result) == len(graph)  # => no cycle: every node made it into the order
print("kata-14 OK")
```

**Run**: `python3 kata.py`

**Output**:

```text
['fetch_deps', 'compile', 'link', 'test']
kata-14 OK
```

</details>

### Kata 15 -- Detect a cycle in a directed graph via DFS coloring

**Task.** Implement `has_cycle(graph: dict[str, list[str]]) -> bool` using white/gray/black DFS
coloring, and verify `True` on a cyclic graph and `False` on an acyclic one. (co-21, co-17)

<details>
<summary>Reference solution</summary>

```python
def has_cycle(graph: dict[str, list[str]]) -> bool:  # => co-21/co-17: white/gray/black DFS coloring
    WHITE, GRAY, BLACK = 0, 1, 2  # => unvisited, currently-on-the-recursion-stack, fully-done
    color: dict[str, int] = {node: WHITE for node in graph}  # => every node starts unvisited

    def _visit(node: str) -> bool:  # => returns True the instant a back-edge (cycle) is found
        color[node] = GRAY  # => mark node as "on the current DFS path"
        for neighbor in graph[node]:  # => explore every outgoing edge
            if color[neighbor] == GRAY:  # => neighbor is an ANCESTOR on the current path -- a cycle!
                return True  # => a back-edge to a GRAY node means a cycle exists
            if color[neighbor] == WHITE and _visit(neighbor):  # => recurse only into unvisited nodes
                return True  # => a cycle was found deeper in the recursion
        color[node] = BLACK  # => node and everything reachable from it is fully explored, cycle-free
        return False

    return any(color[node] == WHITE and _visit(node) for node in graph)  # => check every component


cyclic_graph: dict[str, list[str]] = {"a": ["b"], "b": ["c"], "c": ["a"]}  # => a -> b -> c -> a
acyclic_graph: dict[str, list[str]] = {"a": ["b"], "b": ["c"], "c": []}  # => a -> b -> c, no way back

print(has_cycle(cyclic_graph), has_cycle(acyclic_graph))  # => Output: True False

assert has_cycle(cyclic_graph) is True
assert has_cycle(acyclic_graph) is False
print("kata-15 OK")
```

**Run**: `python3 kata.py`

**Output**:

```text
True False
kata-15 OK
```

</details>

### Kata 16 -- Quickselect for the kth smallest element

**Task.** Implement `quickselect(nums: list[int], k: int) -> int`, returning the kth smallest
(1-indexed) element via partition-based selection, without a full sort. (co-16)

<details>
<summary>Reference solution</summary>

```python
import random


def quickselect(nums: list[int], k: int) -> int:  # => co-16: partition, but recurse into ONE side only
    # => finds the k-th SMALLEST element (1-indexed) without ever fully sorting the input
    target_index = k - 1  # => convert to a 0-indexed position in sorted order
    working = nums.copy()  # => avoid mutating the caller's list

    while True:  # => each iteration discards a partition the answer can't possibly be in
        pivot = random.choice(working)  # => a random pivot avoids worst-case O(n^2) on sorted input
        less = [n for n in working if n < pivot]  # => everything strictly smaller than pivot
        equal = [n for n in working if n == pivot]  # => every occurrence of the pivot value
        greater = [n for n in working if n > pivot]  # => everything strictly larger than pivot

        if target_index < len(less):  # => the target position is entirely inside the LESS partition
            working = less  # => discard equal and greater -- they can't contain the answer
        elif target_index < len(less) + len(equal):  # => the target lands exactly on the pivot value
            return pivot  # => no more partitioning needed -- found it
        else:  # => the target position is inside the GREATER partition
            target_index -= len(less) + len(equal)  # => re-index relative to the smaller GREATER list
            working = greater  # => discard less and equal -- they can't contain the answer


data = [7, 2, 9, 4, 1, 8, 3]  # => sorted, this would be [1, 2, 3, 4, 7, 8, 9]
third_smallest = quickselect(data, 3)  # => the 3rd smallest value overall
print(third_smallest)  # => Output: 3

assert third_smallest == sorted(data)[2]  # => index 2 -- the 3rd element, 0-indexed
print("kata-16 OK")
```

**Run**: `python3 kata.py`

**Output**:

```text
3
kata-16 OK
```

</details>

### Kata 17 -- Two-pointer pair sum on a sorted array

**Task.** Implement `pair_sum_indices(nums: list[int], target: int) -> tuple[int, int] | None`,
returning the two indices of numbers summing to `target`, using two pointers on a sorted list.
(co-20, co-14)

<details>
<summary>Reference solution</summary>

```python
def pair_sum_indices(nums: list[int], target: int) -> tuple[int, int] | None:  # => co-20/co-14
    left, right = 0, len(nums) - 1  # => one pointer at each end of the SORTED array
    while left < right:  # => O(n) single pass -- each step moves exactly one pointer inward
        current = nums[left] + nums[right]  # => the sum this pair of pointers currently represents
        if current == target:  # => found the exact pair
            return left, right
        if current < target:  # => sum too small -- only increasing the LEFT value can help
            left += 1  # => move left pointer inward, toward larger values
        else:  # => sum too large -- only decreasing the RIGHT value can help
            right -= 1  # => move right pointer inward, toward smaller values
    return None  # => pointers crossed without finding a match -- no such pair exists


data = [1, 3, 5, 9, 14, 21]  # => already sorted -- the precondition two-pointer relies on
result = pair_sum_indices(data, 23)  # => 9 (index 3) + 14 (index 4) == 23
print(result)  # => Output: (3, 4)

assert result == (3, 4)
assert pair_sum_indices(data, 100) is None  # => no pair in data sums to 100
print("kata-17 OK")
```

**Run**: `python3 kata.py`

**Output**:

```text
(3, 4)
kata-17 OK
```

</details>

### Kata 18 -- Sliding window: longest substring without repeats

**Task.** Implement `longest_unique_substring(s: str) -> int`, returning the length of the longest
substring with no repeated character, using a variable-size window plus a set. (co-20, co-09)

<details>
<summary>Reference solution</summary>

```python
def longest_unique_substring(s: str) -> int:  # => co-20/co-09: a variable-size window plus a set
    window: set[str] = set()  # => the DISTINCT characters currently inside the window
    left = 0  # => the window's left edge -- only ever moves forward
    longest = 0  # => the best (longest) window length seen so far
    for right, ch in enumerate(s):  # => the window's right edge -- expands one character per step
        while ch in window:  # => a duplicate just entered -- shrink from the LEFT until it's gone
            window.remove(s[left])  # => O(1) average removal from the set
            left += 1  # => the window's left edge advances past the old duplicate
        window.add(ch)  # => the current character is now (uniquely) inside the window
        longest = max(longest, right - left + 1)  # => track the best window width seen so far
    return longest


text = "moonshine"  # => the longest repeat-free run is "shine" (length 5)
result = longest_unique_substring(text)
print(result)  # => Output: 5

assert result == 5
print("kata-18 OK")
```

**Run**: `python3 kata.py`

**Output**:

```text
5
kata-18 OK
```

</details>

### Kata 19 -- LRU cache from scratch

**Task.** Implement an `LRUCache` class with `get`/`put`, both O(1), using a `dict` plus a doubly
linked list -- neither structure alone gives O(1) for both operations. (co-08, co-07)

<details>
<summary>Reference solution</summary>

```python
from __future__ import annotations


class _Node:  # => co-07: a doubly linked node -- prev AND next for O(1) removal from anywhere
    def __init__(self, key: str, value: str) -> None:
        self.key = key
        self.value = value
        self.prev: _Node | None = None
        self.next: _Node | None = None


class LRUCache:  # => co-08/co-07: dict for O(1) lookup + doubly linked list for O(1) reordering
    def __init__(self, capacity: int) -> None:
        self.capacity = capacity
        self.cache: dict[str, _Node] = {}  # => key -> node, O(1) average lookup
        self.head = _Node("", "")  # => dummy head sentinel -- head.next is MOST recently used
        self.tail = _Node("", "")  # => dummy tail sentinel -- tail.prev is LEAST recently used
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node: _Node) -> None:  # => O(1): unlink node from wherever it sits
        assert node.prev is not None and node.next is not None
        node.prev.next = node.next
        node.next.prev = node.prev

    def _insert_front(self, node: _Node) -> None:  # => O(1): splice node right after the head
        assert self.head.next is not None
        node.prev = self.head
        node.next = self.head.next
        self.head.next.prev = node
        self.head.next = node

    def get(self, key: str) -> str | None:  # => O(1) lookup + O(1) reorder
        if key not in self.cache:
            return None
        node = self.cache[key]
        self._remove(node)  # => touching a key refreshes its recency
        self._insert_front(node)
        return node.value

    def put(self, key: str, value: str) -> None:  # => O(1) insert/update + eviction check
        if key in self.cache:
            self._remove(self.cache[key])  # => drop the stale entry before reinserting
        node = _Node(key, value)
        self.cache[key] = node
        self._insert_front(node)
        if len(self.cache) > self.capacity:  # => over capacity -- evict the LEAST recently used
            lru = self.tail.prev
            assert lru is not None and lru is not self.head
            self._remove(lru)
            del self.cache[lru.key]


pages = LRUCache(3)  # => capacity 3
pages.put("home", "v1")
pages.put("about", "v1")
pages.put("contact", "v1")
pages.get("home")  # => refreshes "home" to most-recently-used
pages.put("pricing", "v1")  # => over capacity -- evicts "about" (untouched, least recently used)

evicted = pages.get("about")  # => "about" was evicted -- lookup misses
kept = pages.get("home")  # => "home" was touched recently -- survives eviction
print(evicted, kept)  # => Output: None v1

assert evicted is None
assert kept == "v1"
print("kata-19 OK")
```

**Run**: `python3 kata.py`

**Output**:

```text
None v1
kata-19 OK
```

</details>

### Kata 20 -- Prefix trie: insert, search, starts_with

**Task.** Implement a `Trie` class with `insert(word)`, `search(word) -> bool` (exact match), and
`starts_with(prefix) -> bool`, using dict-based children. (co-08, co-10)

<details>
<summary>Reference solution</summary>

```python
class TrieNode:  # => co-08/co-10: a dict of children (co-08) arranged in a tree shape (co-10)
    def __init__(self) -> None:
        self.children: dict[str, TrieNode] = {}  # => character -> next TrieNode, no fixed alphabet size
        self.is_word_end = False  # => marks "a complete word ends exactly here"


class Trie:  # => O(len(word)) per operation, independent of how many words are stored
    def __init__(self) -> None:
        self.root = TrieNode()  # => the empty-prefix starting point for every lookup

    def insert(self, word: str) -> None:  # => O(len(word))
        node = self.root
        for ch in word:  # => walk (or create) one level per character
            if ch not in node.children:  # => this path doesn't exist yet -- create it
                node.children[ch] = TrieNode()
            node = node.children[ch]  # => descend one level
        node.is_word_end = True  # => mark the LAST node visited as a complete word's end

    def _walk(self, prefix: str) -> TrieNode | None:  # => shared helper for search and starts_with
        node = self.root
        for ch in prefix:  # => O(len(prefix))
            if ch not in node.children:  # => the path doesn't exist -- prefix isn't stored at all
                return None
            node = node.children[ch]
        return node  # => the node the prefix's path ends at, if it exists

    def search(self, word: str) -> bool:  # => exact word match -- must end EXACTLY at a word boundary
        node = self._walk(word)
        return node is not None and node.is_word_end  # => path exists AND it's a complete word

    def starts_with(self, prefix: str) -> bool:  # => any word starting with prefix, complete or not
        return self._walk(prefix) is not None  # => path existing is enough -- no is_word_end check


trie = Trie()
for word in ["cat", "car", "cart", "dog"]:  # => a small mocked vocabulary
    trie.insert(word)

exact_hit = trie.search("car")  # => "car" was inserted as a complete word
exact_miss = trie.search("ca")  # => "ca" is only a PREFIX of other words, never inserted itself
prefix_hit = trie.starts_with("ca")  # => "cat", "car", and "cart" all start with "ca"
prefix_miss = trie.starts_with("xyz")  # => no inserted word starts with "xyz" at all
print(exact_hit, exact_miss, prefix_hit, prefix_miss)  # => Output: True False True False

assert exact_hit is True
assert exact_miss is False
assert prefix_hit is True
assert prefix_miss is False
print("kata-20 OK")
```

**Run**: `python3 kata.py`

**Output**:

```text
True False True False
kata-20 OK
```

</details>

### Kata 21 -- Empirical doubling: linear vs binary search step counts

**Task.** Measure and print the step counts of a linear search and a binary search as `n` doubles,
confirming linear search grows in exact proportion to `n` while binary search grows by roughly a
constant increment per doubling. (co-01, co-13, co-14)

<details>
<summary>Reference solution</summary>

```python
def linear_search_steps(nums: list[int], target: int) -> int:  # => co-13: counts comparisons made
    steps = 0
    for value in nums:  # => O(n) worst case -- stops early only if target IS found
        steps += 1
        if value == target:
            return steps
    return steps  # => target absent -- every element was compared


def binary_search_steps(nums: list[int], target: int) -> int:  # => co-14: counts halvings performed
    steps = 0
    low, high = 0, len(nums) - 1
    while low <= high:
        steps += 1  # => one comparison per halving
        mid = (low + high) // 2
        if nums[mid] == target:
            return steps
        if nums[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return steps


for n in (1_000, 2_000, 4_000, 8_000):  # => n doubles on every iteration
    data = list(range(n))  # => a sorted list, 0..n-1 -- required for binary search's precondition
    target = -1  # => a value NEVER present -- forces the worst case for both searches
    linear_steps = linear_search_steps(data, target)
    binary_steps = binary_search_steps(data, target)
    print(n, linear_steps, binary_steps)
    # => Output rows: linear_steps == n exactly (co-01: O(n));
    # => binary_steps grows by roughly +1 each time n DOUBLES (co-01: O(log n))

assert linear_search_steps(list(range(8_000)), -1) == 8_000  # => O(n): scans every element
assert binary_search_steps(list(range(8_000)), -1) <= 14  # => O(log2(8000)) is a small constant, ~12-13
print("kata-21 OK")
```

**Run**: `python3 kata.py`

**Output**:

```text
1000 1000 9
2000 2000 10
4000 4000 11
8000 8000 12
kata-21 OK
```

</details>

### Kata 22 -- Convert deep recursion to iteration to avoid `RecursionError`

**Task.** Convert a recursive sum-to-n function into an equivalent iterative one, and demonstrate
that the recursive version genuinely fails on deep input while the iterative version, doing the
same computation, does not. (co-18, co-17)

<details>
<summary>Reference solution</summary>

```python
import sys


def sum_recursive(n: int) -> int:  # => co-17: correct, but consumes ONE stack frame per call
    if n == 0:  # => base case
        return 0
    return n + sum_recursive(n - 1)  # => recursive case -- depth grows with n


def sum_iterative(n: int) -> int:  # => co-18: identical result, O(1) stack usage regardless of n
    total = 0
    for i in range(n + 1):  # => a loop, not a call stack -- no per-iteration stack frame at all
        total += i
    return total


small_input = 100  # => well within the default recursion limit -- both versions agree
recursive_result = sum_recursive(small_input)
iterative_result = sum_iterative(small_input)
print(recursive_result, iterative_result)  # => Output: 5050 5050
assert recursive_result == iterative_result == 5050

deep_input = sys.getrecursionlimit() + 500  # => deliberately past Python's default call-stack ceiling
try:
    sum_recursive(deep_input)  # => this WILL raise -- deep_input exceeds the recursion limit
    raised = False
except RecursionError:  # => co-18: RecursionError is a RuntimeError subclass since Python 3.5
    raised = True

iterative_deep_result = sum_iterative(deep_input)  # => the SAME computation, no recursion at all
print(raised)  # => Output: True

assert raised is True  # => confirms the recursive version genuinely failed on deep input
assert iterative_deep_result == deep_input * (deep_input + 1) // 2  # => Gauss's formula, cross-checked
print("kata-22 OK")
```

**Run**: `python3 kata.py`

**Output**:

```text
5050 5050
True
kata-22 OK
```

</details>

## Self-check checklist

Confirm each item without checking the learning track first. If you hesitate, that concept needs
another pass.

- [ ] I can list Big-O's five common growth rates from cheapest to priciest and name one concrete
      Python operation for each, without notes. (co-01)
- [ ] I can explain why `list.append()` is called "amortized O(1)" even though an individual call
      occasionally triggers a slower resize. (co-02)
- [ ] I can name the one operation on a Python list that's O(n) despite the list otherwise being
      backed by contiguous, O(1)-indexed memory. (co-03)
- [ ] I can implement a stack with `list.append`/`list.pop` and explain why those two specific
      methods -- not `insert`/`pop(0)` -- are the O(1) choice. (co-04)
- [ ] I can explain why `collections.deque` beats a plain list for a FIFO queue, citing the
      specific method and its complexity. (co-05)
- [ ] I can name all four O(1) operations `deque` supports and the two structures it generalizes.
      (co-06)
- [ ] I can build a singly linked list from `Node` objects and explain its exact cost tradeoff
      against an array. (co-07)
- [ ] I can state Python `dict`'s ordering guarantee, the version it started in, and why a dict is
      not the same as a sorted structure. (co-08)
- [ ] I can explain when a `set`'s O(1) average membership test beats a list's O(n) scan, with a
      concrete example. (co-09)
- [ ] I can name all four binary tree traversal orders and correctly label each as depth-first or
      breadth-first. (co-10)
- [ ] I can state the BST invariant from memory and explain exactly why it makes an inorder
      traversal yield sorted output. (co-11)
- [ ] I can explain the default min-heap API, Python 3.14's max-heap API, and max-heap simulation by
      negation. (co-12)
- [ ] I can explain when an unsorted list needs an O(n) scan and when an index is worth building.
      (co-13)
- [ ] I can implement binary search iteratively from memory and state its complexity, with the
      precondition it depends on. (co-14)
- [ ] I can name the algorithm behind `sorted()`/`.sort()`, its complexity, and what "stable"
      guarantees about ties. (co-15)
- [ ] I can name which classic comparison sort is the only one with a guaranteed O(n log n) worst
      case, and why the others aren't. (co-16)
- [ ] I can write a correct recursive function with both a base case and a recursive case, and
      explain what each call consumes. (co-17)
- [ ] I can explain what forces a recursive algorithm to be rewritten iteratively, and name the
      specific exception this topic hits. (co-18)
- [ ] I can memoize a naive recursive function with a `dict` cache (or `functools.lru_cache`) and
      explain the complexity class it collapses. (co-19)
- [ ] I can implement a two-pointer or sliding-window solution and explain why it beats an O(n²)
      nested scan. (co-20)
- [ ] I can represent a graph as a dict-of-lists adjacency map and implement both BFS and DFS over
      it from memory. (co-21)
- [ ] I can write a fully type-hinted function signature and explain exactly what checks those
      hints at runtime (hint: nothing does, by default). (co-22)
- [ ] I can explain, in one sentence, what `abstraction-and-its-cost` means for this topic -- name
      one structure and the specific cost it charges for the operation it makes cheap.
      (`abstraction-and-its-cost`)

---

← Previous: [Capstone](../learning/capstone/overview.md) · Next:
[8 · Object-Oriented Programming Essentials](../../object-oriented-programming-essentials/learning/overview.md) →
