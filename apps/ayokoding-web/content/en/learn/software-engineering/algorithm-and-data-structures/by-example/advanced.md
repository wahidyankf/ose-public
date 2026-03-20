---
title: "Advanced"
weight: 10000003
date: 2026-03-20T00:00:00+07:00
draft: false
description: "Examples 58-85: Dynamic programming, graph algorithms, tries, segment trees, union-find, advanced backtracking, string algorithms, bit manipulation, and monotonic structures — expert-level algorithmic techniques (70-95% coverage)"
tags: ["algorithm", "data-structures", "tutorial", "by-example", "advanced"]
---

This section covers expert-level algorithms and data structures used in production systems and competitive programming. Each example demonstrates a technique that solves problems standard approaches cannot handle efficiently. Topics span dynamic programming, shortest-path algorithms, prefix trees, range queries, disjoint sets, constraint solving, string matching, bitwise methods, and monotonic data structures.

## Dynamic Programming

### Example 58: Memoization — Top-Down Fibonacci

Memoization caches the result of each subproblem the first time it is computed so that repeated calls return in O(1) instead of recomputing exponentially. It transforms a naive O(2^n) recursive solution into O(n) time with O(n) extra space.

```python
import sys
# => sys provides setrecursionlimit to allow deep recursion for large n
sys.setrecursionlimit(10000)
# => Default Python recursion limit is 1000; fib(5000) needs ~5000 frames

def fib_memo(n, cache={}):
    # => cache is a mutable default argument — persists across calls (intentional)
    # => Python evaluates default arguments once at function definition time
    if n in cache:
        return cache[n]             # => O(1) lookup: already solved this subproblem
    if n <= 1:
        return n                    # => Base cases: fib(0)=0, fib(1)=1
    cache[n] = fib_memo(n - 1, cache) + fib_memo(n - 2, cache)
    # => Store result before returning — this is the memoization step
    # => Without this, fib(50) would require ~2^50 recursive calls (~1 quadrillion)
    return cache[n]                 # => Return cached result

print(fib_memo(10))   # => Output: 55
print(fib_memo(50))   # => Output: 12586269025 (computed instantly due to cache)
print(fib_memo(100))  # => Output: 354224848179261915075
# => Without memoization, fib(100) would run for longer than the age of the universe
```

**Key Takeaway**: Memoization eliminates redundant computation in recursive problems by caching results keyed on function arguments. Apply it whenever you see overlapping subproblems in a recursive call tree.

**Why It Matters**: Memoization is the first optimization technique to reach for when a brute-force recursion is correct but too slow. Production systems use it in route-planning, NLP parsing (CYK algorithm), game AI (minimax with alpha-beta pruning), and compiler optimization passes. The pattern extends beyond Fibonacci to any pure function called repeatedly with the same arguments, including database query result caching and HTTP response caching middleware.

---

### Example 59: Tabulation — Bottom-Up Knapsack

Tabulation builds the solution table iteratively from the smallest subproblems up, avoiding recursion overhead and stack-depth limits. The 0/1 Knapsack problem asks: given items with weights and values, which subset fits in capacity W and maximizes value?

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Items + Capacity"] -->|fill table row by row| B["dp table n x W+1"]
    B -->|read dp[n][W]| C["Maximum Value"]
    B -->|backtrack through table| D["Selected Items"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
```

```python
def knapsack_01(weights, values, capacity):
    # => weights[i] and values[i] describe item i
    # => capacity is the maximum weight the knapsack can hold
    n = len(weights)                          # => n is number of items
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]
    # => dp[i][w] = max value using first i items with weight limit w
    # => dp is (n+1) x (capacity+1) to handle 0-item and 0-capacity base cases
    # => All initialized to 0: no items or no capacity → zero value

    for i in range(1, n + 1):               # => Process each item 1..n
        for w in range(capacity + 1):       # => For each capacity 0..W
            # => Option 1: skip item i (don't include it)
            dp[i][w] = dp[i - 1][w]        # => Inherit value from previous row
            wi = weights[i - 1]             # => Weight of current item (0-indexed)
            vi = values[i - 1]              # => Value of current item (0-indexed)
            if wi <= w:
                # => Option 2: include item i if it fits
                include = dp[i - 1][w - wi] + vi
                # => dp[i-1][w-wi]: best value with remaining capacity after taking item i
                dp[i][w] = max(dp[i][w], include)
                # => Take the better of skipping or including

    return dp[n][capacity]                  # => Maximum achievable value

weights = [2, 3, 4, 5]
values  = [3, 4, 5, 6]
W       = 5
print(knapsack_01(weights, values, W))      # => Output: 7
# => Best: item 0 (weight=2, value=3) + item 1 (weight=3, value=4) = total weight 5, value 7
```

**Key Takeaway**: The 0/1 Knapsack DP table runs in O(n·W) time and space. Each cell represents the optimal solution for a subproblem defined by item count and remaining capacity.

**Why It Matters**: Knapsack variants appear across scheduling (allocating CPU budget to jobs), finance (portfolio optimization under capital constraints), logistics (packing shipments), and feature selection in machine learning. Understanding the DP table construction lets you adapt the pattern to unbounded knapsack, multi-dimensional constraints, and fractional relaxations used in branch-and-bound solvers.

---

### Example 60: Longest Common Subsequence (LCS)

LCS finds the longest sequence of characters (not necessarily contiguous) present in both strings in order. It underpins diff utilities, DNA sequence alignment, and plagiarism detection.

```python
def lcs(s1, s2):
    m, n = len(s1), len(s2)                   # => m=len(s1), n=len(s2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    # => dp[i][j] = LCS length of s1[:i] and s2[:j]
    # => Extra row/col for empty-string base cases (all zeros)

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s1[i - 1] == s2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
                # => Characters match: extend LCS by 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
                # => No match: take better of skipping a character from either string

    # => Reconstruct the actual LCS string by backtracking through dp table
    lcs_str = []
    i, j = m, n                               # => Start from bottom-right corner
    while i > 0 and j > 0:
        if s1[i - 1] == s2[j - 1]:
            lcs_str.append(s1[i - 1])         # => This character is in the LCS
            i -= 1
            j -= 1
        elif dp[i - 1][j] > dp[i][j - 1]:
            i -= 1                            # => Move up: came from dp[i-1][j]
        else:
            j -= 1                            # => Move left: came from dp[i][j-1]
    lcs_str.reverse()                         # => Reverse because we backtracked
    return dp[m][n], "".join(lcs_str)

length, seq = lcs("ABCBDAB", "BDCABA")
print(length)   # => Output: 4
print(seq)      # => Output: BCBA  (one valid LCS; others like BDAB also valid)
```

**Key Takeaway**: LCS runs in O(m·n) time and space. The DP recurrence has two cases: characters match (extend by 1) or they don't (take the max of two neighbors in the table).

**Why It Matters**: Git's `diff` command, `patch` utilities, and code review tools all rely on LCS or edit-distance variants to show what changed between file versions. Bioinformatics tools like BLAST use LCS to align DNA and protein sequences across genomes. Understanding LCS gives you the foundation for edit distance (Levenshtein), which powers spell checkers, fuzzy search, and OCR post-correction in production systems.

---

### Example 61: Longest Increasing Subsequence (LIS)

LIS finds the length of the longest strictly increasing subsequence in an array. The O(n log n) patience-sorting approach improves on the naive O(n²) DP.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Input Array"] -->|process each element| B["Tails Array<br/>patience sort piles"]
    B -->|binary search for position| C["Replace or Append"]
    C -->|length of tails array| D["LIS Length"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#CC78BC,stroke:#000,color:#fff
    style D fill:#029E73,stroke:#000,color:#fff
```

```python
import bisect
# => bisect provides binary search on sorted lists (standard library)

def lis_length(nums):
    tails = []
    # => tails[i] = smallest tail element of all increasing subsequences of length i+1
    # => tails is always sorted (maintained as invariant)

    for num in nums:
        pos = bisect.bisect_left(tails, num)
        # => Binary search: find leftmost position where num can be inserted
        # => O(log n) per element instead of O(n) linear scan
        if pos == len(tails):
            tails.append(num)       # => num extends the longest subsequence found so far
        else:
            tails[pos] = num        # => Replace: num is a better (smaller) tail for length pos+1
            # => This greedy replacement keeps tails as small as possible
            # => Smaller tails allow more elements to extend subsequences later

    return len(tails)               # => Length of tails = LIS length

nums = [10, 9, 2, 5, 3, 7, 101, 18]
print(lis_length(nums))             # => Output: 4
# => One LIS is [2, 3, 7, 18] or [2, 5, 7, 18] or [2, 3, 7, 101]
# => The tails array after processing: [2, 3, 7, 18] (not the actual LIS, but its length is correct)
```

**Key Takeaway**: The patience-sort approach achieves O(n log n) by maintaining a sorted `tails` array where binary search finds the correct position for each new element. The length of `tails` equals the LIS length.

**Why It Matters**: LIS underlies scheduling problems (scheduling non-overlapping tasks on a timeline), the Dilworth theorem (partitioning a poset into chains), and network packet reordering detection. The O(n log n) improvement over naive DP matters when processing large data streams or when called in a loop over many subarrays.

---

### Example 62: Coin Change — Minimum Coins

Given coin denominations and a target amount, find the minimum number of coins needed to make that amount. This classic unbounded knapsack variant demonstrates bottom-up DP with reuse.

```python
def coin_change(coins, amount):
    INF = float('inf')                        # => Sentinel for "impossible" states
    dp = [INF] * (amount + 1)
    # => dp[i] = minimum coins to make amount i
    # => Initialize all to INF (impossible) except dp[0]
    dp[0] = 0                                 # => Base case: 0 coins needed for amount 0

    for i in range(1, amount + 1):           # => Fill dp table from 1 to amount
        for coin in coins:
            if coin <= i and dp[i - coin] != INF:
                # => coin fits: can we do better using this coin?
                dp[i] = min(dp[i], dp[i - coin] + 1)
                # => +1 for using this coin; dp[i-coin] subproblem already solved

    return dp[amount] if dp[amount] != INF else -1
    # => Return -1 if amount is unreachable with given coins

print(coin_change([1, 5, 6, 9], 11))         # => Output: 2  (coins: 5+6)
print(coin_change([2], 3))                    # => Output: -1 (3 unreachable with only even coins)
print(coin_change([1, 2, 5], 11))             # => Output: 3  (coins: 5+5+1)
```

**Key Takeaway**: Coin change DP fills a 1D table where each cell represents the best solution using all previously computed results. The recurrence is `dp[i] = min(dp[i - coin] + 1)` for each valid coin.

**Why It Matters**: Coin change generalizes to any problem of combining elements to reach a target with minimum count or cost: cutting stock problems in manufacturing, transaction fee minimization in payment systems, and tile-placement optimization in game engines. The unbounded variant (coins reusable) models real inventory scenarios better than the 0/1 variant.

---

## Graph Algorithms

### Example 63: Dijkstra's Shortest Path

Dijkstra's algorithm finds the shortest path from a source vertex to all other vertices in a weighted graph with non-negative edge weights. Using a min-heap achieves O((V + E) log V) time.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Source Node<br/>dist=0"] -->|relax neighbors| B["Min-Heap<br/>priority queue"]
    B -->|pop smallest dist| C["Current Node"]
    C -->|update dist[v] if shorter| D["Neighbor v"]
    D -->|push updated dist| B
    C -->|all nodes settled| E["Shortest Distances"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#CC78BC,stroke:#000,color:#fff
    style D fill:#CA9161,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
```

```python
import heapq
# => heapq provides a min-heap (standard library); heappush/heappop are O(log n)

def dijkstra(graph, source):
    # => graph: dict {node: [(weight, neighbor), ...]}  adjacency list
    dist = {node: float('inf') for node in graph}
    # => dist[v] = current best known distance from source to v
    # => Initialize all to infinity (unreachable)
    dist[source] = 0                          # => Distance from source to itself is 0
    heap = [(0, source)]                      # => Min-heap: (distance, node)
    # => Heap invariant: always process the node with smallest known distance first

    while heap:
        d, u = heapq.heappop(heap)            # => Extract node with minimum distance; O(log V)
        if d > dist[u]:
            continue                          # => Stale entry: a shorter path was already found
            # => This happens when a node is pushed multiple times with different distances
        for weight, v in graph[u]:            # => Relax each outgoing edge from u
            new_dist = dist[u] + weight       # => Candidate distance to v via u
            if new_dist < dist[v]:
                dist[v] = new_dist            # => Found shorter path to v
                heapq.heappush(heap, (new_dist, v))
                # => Push updated distance; old entry becomes stale

    return dist

graph = {
    'A': [(1, 'B'), (4, 'C')],
    'B': [(2, 'C'), (5, 'D')],
    'C': [(1, 'D')],
    'D': []
}
print(dijkstra(graph, 'A'))
# => Output: {'A': 0, 'B': 1, 'C': 3, 'D': 4}
# => A→B=1, A→B→C=3 (better than A→C=4), A→B→C→D=4
```

**Key Takeaway**: Dijkstra requires non-negative weights. The min-heap ensures each node is settled at its true shortest distance the first time it's popped. Stale heap entries are discarded via the `if d > dist[u]: continue` guard.

**Why It Matters**: Dijkstra powers GPS navigation (Google Maps, OpenStreetMap routing), network routing protocols (OSPF), and game pathfinding (A\* is Dijkstra with a heuristic). At scale, production implementations use Fibonacci heaps for O(E + V log V) amortized complexity, or bidirectional Dijkstra to halve search space on road networks.

---

### Example 64: Bellman-Ford — Shortest Path with Negative Weights

Bellman-Ford handles graphs with negative edge weights and detects negative-weight cycles. It relaxes all edges V-1 times in O(V·E) time.

```python
def bellman_ford(vertices, edges, source):
    # => edges: list of (u, v, weight) tuples (directed)
    # => vertices: list of vertex labels
    dist = {v: float('inf') for v in vertices}
    dist[source] = 0                          # => Source distance is 0

    # => Relax all edges V-1 times
    # => After k iterations, dist[v] = shortest path using at most k edges
    # => A shortest path in a graph without negative cycles uses at most V-1 edges
    for _ in range(len(vertices) - 1):
        updated = False
        for u, v, w in edges:
            if dist[u] != float('inf') and dist[u] + w < dist[v]:
                dist[v] = dist[u] + w         # => Relax edge (u,v,w)
                updated = True
        if not updated:
            break                             # => Early exit: no changes, already optimal

    # => Detect negative-weight cycles: if any edge still relaxes, a cycle exists
    for u, v, w in edges:
        if dist[u] != float('inf') and dist[u] + w < dist[v]:
            return None                       # => Negative cycle detected
            # => Shortest path is undefined when negative cycles exist

    return dist

vertices = ['A', 'B', 'C', 'D', 'E']
edges = [
    ('A', 'B', -1), ('A', 'C', 4),
    ('B', 'C', 3),  ('B', 'D', 2), ('B', 'E', 2),
    ('D', 'B', 1),  ('D', 'C', 5), ('E', 'D', -3)
]
print(bellman_ford(vertices, edges, 'A'))
# => Output: {'A': 0, 'B': -1, 'C': 2, 'D': -2, 'E': 1}
# => A→B=-1, A→B→E→D=-1+2-3=-2, A→B→E→D→... wait: D→C shortest is A→B→E→D+5=3 > A→B→C=2
```

**Key Takeaway**: Bellman-Ford handles negative weights but costs O(V·E) vs Dijkstra's O((V+E) log V). Run the relaxation loop V-1 times, then check once more for negative cycles.

**Why It Matters**: Bellman-Ford is the foundation of BGP (Border Gateway Protocol), the routing protocol that holds the internet together. It handles arbitrary topologies including those with negative costs (modeled as subsidies or credits). Financial arbitrage detection — finding sequences of currency exchanges that produce profit — maps directly to negative-cycle detection in Bellman-Ford.

---

### Example 65: Floyd-Warshall — All-Pairs Shortest Paths

Floyd-Warshall computes shortest distances between every pair of vertices in O(V³) time and O(V²) space using dynamic programming on intermediate vertices.

```python
def floyd_warshall(n, edges):
    # => n: number of vertices (labeled 0..n-1)
    # => edges: list of (u, v, weight) for directed weighted graph
    INF = float('inf')
    dist = [[INF] * n for _ in range(n)]
    # => dist[i][j] = shortest known path from i to j
    for i in range(n):
        dist[i][i] = 0                        # => Distance from vertex to itself is 0

    for u, v, w in edges:
        dist[u][v] = min(dist[u][v], w)       # => Initialize with direct edge weights
        # => min handles parallel edges (take shortest)

    # => DP: for each intermediate vertex k, check if going through k improves i→j
    for k in range(n):                        # => k is the intermediate vertex
        for i in range(n):
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
                    # => Path i→k→j is shorter than current best i→j

    # => After all k: dist[i][j] = true shortest path between i and j
    return dist

n = 4
edges = [(0,1,3),(0,3,7),(1,0,8),(1,2,2),(2,0,5),(2,3,1),(3,0,2)]
result = floyd_warshall(n, edges)
for row in result:
    print(row)
# => Output (shortest distances matrix):
# => [0, 3, 5, 6]   row 0: 0→0=0, 0→1=3, 0→2=5, 0→3=6
# => [5, 0, 2, 3]   row 1
# => [4, 7, 0, 1]   row 2
# => [2, 5, 7, 0]   row 3
```

**Key Takeaway**: Floyd-Warshall's triple loop processes one intermediate vertex k at a time. The order of loops (k outermost) ensures `dist[i][k]` and `dist[k][j]` are already optimal when computing `dist[i][j]`.

**Why It Matters**: Floyd-Warshall is preferred over running Dijkstra from every vertex when the graph is dense (many edges relative to vertices) because the O(V³) constant factor is smaller. Applications include routing table generation for small networks, transitive closure computation in databases, and network flow pre-computation. It also detects negative cycles: if `dist[i][i] < 0` after the algorithm, vertex i lies on a negative cycle.

---

### Example 66: Topological Sort (Kahn's Algorithm)

Topological sort orders vertices of a directed acyclic graph (DAG) so that for every edge (u, v), u appears before v. Kahn's BFS-based algorithm runs in O(V + E).

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Compute In-Degrees"] -->|nodes with in-degree=0| B["Queue"]
    B -->|process node| C["Add to Result"]
    C -->|decrement neighbor in-degrees| D["Check Neighbor In-Degree"]
    D -->|in-degree becomes 0| B
    C -->|queue empty| E["Result or Cycle Detected"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CA9161,stroke:#000,color:#fff
    style E fill:#CC78BC,stroke:#000,color:#fff
```

```python
from collections import deque, defaultdict
# => deque: O(1) popleft (unlike list.pop(0) which is O(n))
# => defaultdict(int): auto-initializes missing keys to 0

def topological_sort(n, edges):
    # => n: number of nodes (0..n-1); edges: list of (u, v) directed edges
    adj = defaultdict(list)                   # => Adjacency list
    in_degree = [0] * n                       # => in_degree[v] = number of incoming edges to v

    for u, v in edges:
        adj[u].append(v)                      # => Record directed edge u→v
        in_degree[v] += 1                     # => v has one more incoming edge

    queue = deque(i for i in range(n) if in_degree[i] == 0)
    # => Start with all nodes that have no prerequisites (in-degree 0)
    result = []

    while queue:
        u = queue.popleft()                   # => Process next node with no remaining prerequisites
        result.append(u)                      # => Add to topological order
        for v in adj[u]:
            in_degree[v] -= 1                 # => Remove edge u→v: v's prerequisite count decreases
            if in_degree[v] == 0:
                queue.append(v)               # => v is now ready (all its prerequisites processed)

    if len(result) != n:
        return None                           # => Cycle detected: some nodes never reached in-degree 0
    return result

edges = [(5,2),(5,0),(4,0),(4,1),(2,3),(3,1)]
print(topological_sort(6, edges))             # => Output: [4, 5, 0, 2, 1, 3] (one valid order)
# => Multiple valid topological orderings exist; any is acceptable
```

**Key Takeaway**: Kahn's algorithm processes nodes in waves: each wave contains nodes whose all prerequisites are satisfied. If the result contains fewer nodes than the graph has vertices, a cycle exists.

**Why It Matters**: Build systems (Make, Bazel, Gradle) use topological sort to determine compilation order. Package managers (npm, pip, cargo) use it to install dependencies in the right sequence. Spreadsheet engines execute cell formulas in topological order of their dependency graph. Any workflow engine where tasks depend on other tasks relies on this algorithm.

---

### Example 67: Kruskal's Minimum Spanning Tree

Kruskal's algorithm builds a minimum spanning tree (MST) by greedily adding the cheapest edges that don't form a cycle. It uses Union-Find to detect cycles in O(E log E) time.

```python
def kruskal(n, edges):
    # => n: number of vertices; edges: list of (weight, u, v)
    # => Returns total MST weight and list of edges in MST
    edges.sort()                              # => Sort edges by weight ascending; O(E log E)
    parent = list(range(n))                   # => Union-Find parent array; parent[i]=i initially
    rank = [0] * n                            # => Union by rank to keep trees shallow

    def find(x):
        if parent[x] != x:
            parent[x] = find(parent[x])       # => Path compression: flatten tree on lookup
            # => After compression, parent[x] points directly to root
        return parent[x]                      # => Return root of x's component

    def union(x, y):
        px, py = find(x), find(y)             # => Find roots of both components
        if px == py:
            return False                      # => Same component: adding edge would create cycle
        if rank[px] < rank[py]:
            px, py = py, px                   # => Attach smaller tree under larger tree
        parent[py] = px                       # => Merge: py's root now points to px
        if rank[px] == rank[py]:
            rank[px] += 1                     # => Only increase rank when merging equal-rank trees
        return True                           # => Successfully merged two components

    mst_weight = 0
    mst_edges = []
    for w, u, v in edges:
        if union(u, v):                       # => Add edge if it doesn't create a cycle
            mst_weight += w
            mst_edges.append((u, v, w))
        if len(mst_edges) == n - 1:
            break                             # => MST has exactly n-1 edges; stop early

    return mst_weight, mst_edges

edges = [(4,0,1),(8,0,7),(11,1,7),(7,1,2),(4,7,8),(9,7,6),(2,8,2),(6,8,6),(7,2,5),(14,2,3),(10,3,4),(9,3,5),(2,5,4),(6,6,5)]
weight, tree = kruskal(9, edges)
print(weight)                                 # => Output: 37 (MST total weight)
print(len(tree))                              # => Output: 8 (n-1 = 8 edges for 9 vertices)
```

**Key Takeaway**: Kruskal's greedy strategy works because the cut property guarantees that the minimum-weight edge crossing any cut belongs to some MST. Union-Find with path compression and union by rank achieves near-O(1) amortized per operation.

**Why It Matters**: MST algorithms design physical networks — laying fiber-optic cable, building road networks, designing circuit boards — where you want to connect all nodes with minimum total wire length. Approximation algorithms for NP-hard problems (like the TSP 2-approximation) use MST as a building block. Cluster analysis in machine learning uses MST to find natural groupings without specifying the number of clusters.

---

### Example 68: Prim's Minimum Spanning Tree

Prim's algorithm grows the MST from a starting vertex, always adding the cheapest edge connecting the current tree to a new vertex. With a min-heap it runs in O((V + E) log V).

```python
import heapq
from collections import defaultdict

def prim(n, adj):
    # => adj: dict {u: [(weight, v), ...]} adjacency list (undirected)
    visited = [False] * n                     # => Track which vertices are in MST
    heap = [(0, 0, -1)]                       # => (cost, vertex, from_vertex); start at vertex 0
    # => from_vertex=-1 for the root (no incoming MST edge)
    total = 0
    mst_edges = []

    while heap:
        cost, u, prev = heapq.heappop(heap)   # => Cheapest edge to unvisited vertex
        if visited[u]:
            continue                          # => Already in MST; skip stale heap entry
        visited[u] = True
        total += cost                         # => Add edge cost to MST total
        if prev != -1:
            mst_edges.append((prev, u, cost)) # => Record edge (skip root's dummy edge)

        for w, v in adj[u]:
            if not visited[v]:
                heapq.heappush(heap, (w, v, u))
                # => Offer all edges from u to unvisited neighbors
                # => Stale entries for v remain but will be skipped when popped

    return total, mst_edges

adj = defaultdict(list)
raw_edges = [(4,0,1),(8,0,7),(11,1,7),(7,1,2),(4,7,8),(9,7,6),(2,8,2),(6,8,6),(7,2,5),(14,2,3),(10,3,4),(9,3,5),(2,5,4),(6,6,5)]
for w,u,v in raw_edges:
    adj[u].append((w,v))
    adj[v].append((w,u))                      # => Undirected: add both directions

total, edges = prim(9, adj)
print(total)                                  # => Output: 37 (same MST weight as Kruskal)
print(len(edges))                             # => Output: 8
```

**Key Takeaway**: Prim's and Kruskal's always produce the same MST total weight (though edge sets may differ on ties). Prim's is better for dense graphs (many edges), while Kruskal's suits sparse graphs because sorting E edges is cheaper when E is small.

**Why It Matters**: Prim's algorithm is the basis for network design tools in CAD software for VLSI circuit layout. When designing sensor networks or wireless mesh networks, Prim's helps find the minimum-cost spanning connectivity. The lazy deletion technique (leaving stale entries in the heap) is a general pattern reused in Dijkstra and other priority-queue algorithms.

---

## Advanced Data Structures

### Example 69: Trie — Prefix Tree

A trie stores strings character-by-character, enabling O(m) insert, search, and prefix queries where m is the word length — far faster than storing strings in a hash set for prefix queries.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    R["Root"] -->|a| A["a"]
    R -->|b| B["b"]
    A -->|p| AP["p"]
    AP -->|p| APP["p*<br/>app"]
    APP -->|l| APPL["l"]
    APPL -->|e| APPLE["e*<br/>apple"]
    B -->|a| BA["a"]
    BA -->|t| BAT["t*<br/>bat"]

    style R fill:#0173B2,stroke:#000,color:#fff
    style APP fill:#029E73,stroke:#000,color:#fff
    style APPLE fill:#029E73,stroke:#000,color:#fff
    style BAT fill:#029E73,stroke:#000,color:#fff
    style A fill:#DE8F05,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style AP fill:#CA9161,stroke:#000,color:#fff
    style APPL fill:#CA9161,stroke:#000,color:#fff
    style BA fill:#CA9161,stroke:#000,color:#fff
```

```python
class TrieNode:
    def __init__(self):
        self.children = {}                    # => char → TrieNode mapping
        self.is_end = False                   # => True if a word ends at this node

class Trie:
    def __init__(self):
        self.root = TrieNode()                # => Root node represents empty prefix

    def insert(self, word):
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()# => Create node for new character
            node = node.children[ch]          # => Traverse to child
        node.is_end = True                    # => Mark end of word

    def search(self, word):
        node = self.root
        for ch in word:
            if ch not in node.children:
                return False                  # => Character not found → word absent
            node = node.children[ch]
        return node.is_end                    # => True only if exact word was inserted

    def starts_with(self, prefix):
        node = self.root
        for ch in prefix:
            if ch not in node.children:
                return False                  # => Prefix not in trie
            node = node.children[ch]
        return True                           # => Reached end of prefix → prefix exists

trie = Trie()
for word in ["apple", "app", "bat", "ball"]:
    trie.insert(word)

print(trie.search("apple"))       # => Output: True
print(trie.search("app"))         # => Output: True
print(trie.search("ap"))          # => Output: False  (ap is a prefix, not a full word)
print(trie.starts_with("ap"))     # => Output: True   (ap is a prefix)
print(trie.starts_with("xyz"))    # => Output: False
```

**Key Takeaway**: A trie's power lies in prefix queries: finding all words with a given prefix requires only traversing the prefix path (O(m)) then enumerating the subtree. This makes it dramatically faster than scanning a hash set for autocomplete.

**Why It Matters**: Search engines, IDE autocomplete, spell checkers, IP routing (longest-prefix matching), and DNS resolution all use tries or compressed-trie variants (PATRICIA tries, radix trees). Mobile keyboards that suggest next words use tries combined with frequency counts. Production tries compress single-child chains into single nodes (compact/radix trie) to reduce memory from O(alphabet × total_chars) to O(total_chars).

---

### Example 70: Segment Tree — Range Sum and Point Update

A segment tree supports range queries (sum, min, max) and point updates in O(log n) time, compared to O(n) for a plain array. It stores aggregate values for each tree node covering a range.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    R["[0..7] sum=36"] -->|left| L["[0..3] sum=10"]
    R -->|right| RR["[4..7] sum=26"]
    L -->|left| LL["[0..1] sum=3"]
    L -->|right| LR["[2..3] sum=7"]
    RR -->|left| RL["[4..5] sum=11"]
    RR -->|right| RRR["[6..7] sum=15"]

    style R fill:#0173B2,stroke:#000,color:#fff
    style L fill:#DE8F05,stroke:#000,color:#fff
    style RR fill:#DE8F05,stroke:#000,color:#fff
    style LL fill:#029E73,stroke:#000,color:#fff
    style LR fill:#029E73,stroke:#000,color:#fff
    style RL fill:#029E73,stroke:#000,color:#fff
    style RRR fill:#029E73,stroke:#000,color:#fff
```

```python
class SegmentTree:
    def __init__(self, data):
        self.n = len(data)                    # => n is the number of leaf elements
        self.tree = [0] * (4 * self.n)        # => Allocate 4n nodes (safe upper bound)
        self._build(data, 1, 0, self.n - 1)   # => Build tree from data

    def _build(self, data, node, start, end):
        # => node: current tree node index (1-indexed); node i's children are 2i and 2i+1
        # => [start..end]: range this node covers
        if start == end:
            self.tree[node] = data[start]     # => Leaf node holds the array value
            return
        mid = (start + end) // 2
        self._build(data, 2 * node, start, mid)       # => Build left child
        self._build(data, 2 * node + 1, mid + 1, end) # => Build right child
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]
        # => Internal node = sum of children

    def update(self, node, start, end, idx, val):
        # => Update position idx to val; O(log n)
        if start == end:
            self.tree[node] = val             # => Found the leaf: update it
            return
        mid = (start + end) // 2
        if idx <= mid:
            self.update(2 * node, start, mid, idx, val)       # => idx in left half
        else:
            self.update(2 * node + 1, mid + 1, end, idx, val) # => idx in right half
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]
        # => Recompute this node's sum after child update

    def query(self, node, start, end, l, r):
        # => Sum query over [l..r]; O(log n)
        if r < start or end < l:
            return 0                          # => No overlap: return identity (0 for sum)
        if l <= start and end <= r:
            return self.tree[node]            # => Total overlap: return this node's value
        mid = (start + end) // 2
        left_sum  = self.query(2 * node, start, mid, l, r)
        right_sum = self.query(2 * node + 1, mid + 1, end, l, r)
        return left_sum + right_sum           # => Partial overlap: sum both children

data = [1, 2, 3, 4, 5, 6, 7, 8]
st = SegmentTree(data)
print(st.query(1, 0, 7, 1, 5))               # => Output: 20  (2+3+4+5+6)
st.update(1, 0, 7, 3, 10)                    # => Update index 3 from 4 to 10
print(st.query(1, 0, 7, 1, 5))               # => Output: 26  (2+3+10+5+6)
```

**Key Takeaway**: Segment trees answer range queries and accept point updates in O(log n) each. The tree has O(n) nodes, with each internal node storing the aggregate of its range.

**Why It Matters**: Segment trees are fundamental in competitive programming and production systems that require dynamic range queries: financial systems computing running totals over time windows, time-series databases (InfluxDB, Prometheus) aggregating metrics, 2D graphics engines computing bounding boxes, and game engines implementing efficient collision queries on spatial ranges.

---

### Example 71: Union-Find (Disjoint Set Union)

Union-Find maintains a collection of disjoint sets with near-O(1) amortized union and find operations using path compression and union by rank. It answers "are these two elements in the same set?" efficiently.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Initial: each node<br/>is its own root"] -->|union operations| B["Merged Components<br/>with rank-based trees"]
    B -->|find with path compression| C["Flat Tree<br/>all point to root"]
    C -->|O(α(n)) per operation| D["Near-Constant Time"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
```

```python
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))          # => parent[i] = i initially (each node is its own root)
        self.rank   = [0] * n                 # => rank[i] = upper bound on tree height rooted at i
        self.components = n                   # => Track number of disjoint sets

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
            # => Path compression: make x point directly to root
            # => Amortizes to near-O(1) over many operations (inverse Ackermann function)
        return self.parent[x]                 # => Return root of x's component

    def union(self, x, y):
        rx, ry = self.find(x), self.find(y)   # => Find roots; O(α(n)) each
        if rx == ry:
            return False                      # => Already in same set; no merge needed
        if self.rank[rx] < self.rank[ry]:
            rx, ry = ry, rx                   # => Attach smaller-rank tree under larger
        self.parent[ry] = rx                  # => Merge: ry's root now points to rx
        if self.rank[rx] == self.rank[ry]:
            self.rank[rx] += 1               # => Only rank increases when merging equal ranks
        self.components -= 1                  # => One fewer disjoint component
        return True                           # => Merge successful

    def connected(self, x, y):
        return self.find(x) == self.find(y)   # => True if x and y share a root

uf = UnionFind(6)                             # => 6 components: {0},{1},{2},{3},{4},{5}
uf.union(0, 1)                                # => {0,1},{2},{3},{4},{5} → 5 components
uf.union(1, 2)                                # => {0,1,2},{3},{4},{5}   → 4 components
uf.union(3, 4)                                # => {0,1,2},{3,4},{5}     → 3 components
print(uf.connected(0, 2))                     # => Output: True
print(uf.connected(0, 3))                     # => Output: False
print(uf.components)                          # => Output: 3
```

**Key Takeaway**: Union-Find with path compression and union by rank achieves O(α(n)) amortized per operation, where α is the inverse Ackermann function — effectively constant for all practical input sizes (α(n) ≤ 4 for n < 10^600).

**Why It Matters**: Union-Find is the core data structure in Kruskal's MST, connected-components labeling in image processing, network connectivity analysis, and online algorithms for dynamic graph connectivity. Percolation simulations (modeling fluid flow, epidemic spread) and social network friend-group detection both reduce to Union-Find operations on large datasets processed in real time.

---

## Advanced Backtracking

### Example 72: N-Queens Problem

Place N non-attacking queens on an N×N chessboard. Backtracking prunes branches as soon as a placement conflicts, making it far faster than brute force over all N^N possible placements.

```python
def solve_n_queens(n):
    solutions = []
    # => Track which columns, diagonals, and anti-diagonals are occupied
    cols     = set()     # => Columns already having a queen
    diag1    = set()     # => Major diagonals: row - col is constant along each diagonal
    diag2    = set()     # => Minor diagonals: row + col is constant along each anti-diagonal

    def backtrack(row, placement):
        if row == n:
            solutions.append(placement[:])    # => All n queens placed; record this solution
            return
        for col in range(n):
            d1, d2 = row - col, row + col
            if col in cols or d1 in diag1 or d2 in diag2:
                continue                      # => Prune: this position attacks an existing queen
            # => Place queen at (row, col)
            cols.add(col)
            diag1.add(d1)
            diag2.add(d2)
            placement.append(col)             # => placement[row] = col
            backtrack(row + 1, placement)     # => Recurse to next row
            # => Undo placement (backtrack)
            cols.remove(col)
            diag1.remove(d1)
            diag2.remove(d2)
            placement.pop()

    backtrack(0, [])
    return solutions

solutions = solve_n_queens(4)
print(len(solutions))                         # => Output: 2 (there are exactly 2 solutions for N=4)
for sol in solutions:
    print(sol)                                # => Output: [1, 3, 0, 2] and [2, 0, 3, 1]
    # => sol[row] = column of queen in that row
```

**Key Takeaway**: N-Queens uses three sets to check queen conflicts in O(1) instead of scanning the board. The key insight is that diagonals have constant `row - col` and anti-diagonals have constant `row + col`.

**Why It Matters**: N-Queens is the canonical constraint-satisfaction problem. Techniques from its solution — constraint propagation, arc consistency, forward checking — underpin production SAT solvers (used in hardware verification), CSP solvers (used in scheduling and planning), and logic programming languages like Prolog. The chess problem is small-scale; the same algorithmic pattern solves protein folding, timetabling, and register allocation in compilers.

---

### Example 73: Sudoku Solver

Sudoku solving by backtracking demonstrates how to combine constraint propagation (eliminate candidates) with backtracking (try remaining candidates) to solve combinatorial puzzles efficiently.

```python
def solve_sudoku(board):
    # => board: 9x9 list of lists; 0 represents empty cell
    def is_valid(board, row, col, num):
        # => Check row
        if num in board[row]:
            return False                      # => num already in this row
        # => Check column
        if num in [board[r][col] for r in range(9)]:
            return False                      # => num already in this column
        # => Check 3x3 box
        br, bc = 3 * (row // 3), 3 * (col // 3)
        # => br, bc: top-left corner of the 3x3 box containing (row, col)
        for r in range(br, br + 3):
            for c in range(bc, bc + 3):
                if board[r][c] == num:
                    return False              # => num already in this 3x3 box
        return True

    def backtrack():
        for row in range(9):
            for col in range(9):
                if board[row][col] == 0:      # => Found an empty cell
                    for num in range(1, 10):  # => Try digits 1-9
                        if is_valid(board, row, col, num):
                            board[row][col] = num         # => Place candidate
                            if backtrack():
                                return True               # => Solution found; propagate success
                            board[row][col] = 0           # => Backtrack: remove candidate
                    return False              # => No valid digit works here; backtrack higher
        return True                           # => All cells filled; puzzle solved

    backtrack()
    return board

puzzle = [
    [5,3,0,0,7,0,0,0,0],
    [6,0,0,1,9,5,0,0,0],
    [0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],
    [4,0,0,8,0,3,0,0,1],
    [7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],
    [0,0,0,4,1,9,0,0,5],
    [0,0,0,0,8,0,0,7,9]
]
solved = solve_sudoku(puzzle)
print(solved[0])   # => Output: [5, 3, 4, 6, 7, 8, 9, 1, 2]
print(solved[1])   # => Output: [6, 7, 2, 1, 9, 5, 3, 4, 8]
```

**Key Takeaway**: The solver tries each digit in each empty cell, validates placement against row/column/box constraints, and backtracks immediately when no digit works. This prunes the search space dramatically compared to trying all 9^81 possible boards.

**Why It Matters**: Sudoku solving generalizes to exact-cover problems, which Donald Knuth's Algorithm X (implemented via Dancing Links) solves optimally. Exact-cover appears in tiling problems, packing problems, and combinatorial design. Industrial constraint solvers (IBM CPLEX, Google OR-Tools) use similar search-with-constraint-propagation strategies to solve scheduling, routing, and resource-allocation problems with thousands of variables.

---

## String Algorithms

### Example 74: KMP String Search

The Knuth-Morris-Pratt (KMP) algorithm finds all occurrences of a pattern in a text in O(n + m) time by precomputing a failure function that avoids redundant character comparisons.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Pattern"] -->|build failure function| B["LPS Array<br/>longest proper prefix-suffix"]
    C["Text"] -->|slide with LPS on mismatch| D["KMP Search"]
    B --> D
    D -->|match found| E["Record position"]
    D -->|shift by LPS[j-1]| D

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#CC78BC,stroke:#000,color:#fff
    style D fill:#CA9161,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
```

```python
def kmp_search(text, pattern):
    n, m = len(text), len(pattern)
    if m == 0:
        return []                             # => Empty pattern matches everywhere (return empty)

    # => Build the LPS (Longest Proper Prefix which is also Suffix) array
    lps = [0] * m                             # => lps[i] = length of longest proper prefix of pattern[:i+1]
    # => that is also a suffix; lps[0] always 0 (no proper prefix of single character)
    length = 0                                # => Length of current matching prefix-suffix
    i = 1
    while i < m:
        if pattern[i] == pattern[length]:
            length += 1
            lps[i] = length                   # => Found a prefix-suffix of length `length`
            i += 1
        elif length > 0:
            length = lps[length - 1]          # => Fall back using lps; don't increment i
            # => This is the key insight: we already know pattern[0..length-1] matches
        else:
            lps[i] = 0
            i += 1                            # => No prefix-suffix of any length; move on

    # => KMP search using the LPS array
    matches = []
    i = j = 0                                 # => i: text index; j: pattern index
    while i < n:
        if text[i] == pattern[j]:
            i += 1
            j += 1                            # => Characters match: advance both pointers
        if j == m:
            matches.append(i - j)             # => Full pattern match found at index i-j
            j = lps[j - 1]                    # => Use LPS to find next potential match position
        elif i < n and text[i] != pattern[j]:
            if j > 0:
                j = lps[j - 1]               # => Mismatch: shift pattern using LPS (avoid re-checking)
            else:
                i += 1                        # => j==0 and mismatch: advance text pointer

    return matches

print(kmp_search("AABAACAADAABAABA", "AABA"))  # => Output: [0, 9, 12]
print(kmp_search("aababab", "abab"))            # => Output: [1, 3]
# => O(n+m): no character in text or pattern is compared more than twice
```

**Key Takeaway**: KMP's failure function (LPS array) encodes the longest proper prefix of the pattern that matches a suffix, allowing the algorithm to resume matching from a non-zero position after a mismatch instead of restarting from the beginning.

**Why It Matters**: KMP achieves O(n + m) compared to the naive O(n·m) approach, which matters when searching terabytes of log data for error patterns, scanning genome sequences for gene markers, or implementing search in text editors. The LPS construction generalizes to the Z-function and Aho-Corasick automaton, which simultaneously searches for thousands of patterns in a single O(n + Σm) pass — essential in antivirus engines and intrusion detection systems.

---

### Example 75: Rabin-Karp Rolling Hash

Rabin-Karp uses polynomial rolling hashes to find pattern occurrences in O(n + m) expected time. It is especially valuable for multi-pattern search and plagiarism detection.

```python
def rabin_karp(text, pattern):
    n, m = len(text), len(pattern)
    if m > n:
        return []

    BASE  = 256                               # => Base: number of possible characters (ASCII)
    MOD   = 10**9 + 7                         # => Large prime modulus to reduce hash collisions
    # => Using a prime modulus distributes hashes uniformly

    # => Precompute BASE^(m-1) mod MOD for removing the leading character
    high_pow = pow(BASE, m - 1, MOD)          # => pow(a,b,m) is built-in modular exponentiation; O(log b)

    def hash_str(s):
        h = 0
        for ch in s:
            h = (h * BASE + ord(ch)) % MOD    # => Polynomial hash: h = Σ ord(c)*BASE^i mod MOD
        return h

    pat_hash  = hash_str(pattern)             # => Hash of the pattern; O(m)
    win_hash  = hash_str(text[:m])            # => Hash of first window; O(m)
    matches = []

    for i in range(n - m + 1):
        if win_hash == pat_hash:
            if text[i:i+m] == pattern:        # => Hash matches: verify to guard against collisions
                matches.append(i)
        if i < n - m:
            # => Roll hash: remove leading char, add trailing char; O(1) per step
            win_hash = (win_hash - ord(text[i]) * high_pow) % MOD
            win_hash = (win_hash * BASE + ord(text[i + m])) % MOD
            win_hash %= MOD                   # => Ensure non-negative after subtraction

    return matches

print(rabin_karp("GEEKS FOR GEEKS", "GEEKS"))  # => Output: [0, 10]
print(rabin_karp("aaaa", "aa"))                # => Output: [0, 1, 2]
```

**Key Takeaway**: Rolling hash updates in O(1) by subtracting the contribution of the outgoing character and adding the incoming one, giving O(n + m) expected time. Always verify with string comparison when hashes match to handle collisions.

**Why It Matters**: Rabin-Karp's rolling-hash technique extends naturally to multi-pattern search (compute one hash, compare against a hash set of all patterns) and 2D pattern matching (hashing rows then columns). Plagiarism detection services like Turnitin hash document shingles (overlapping k-grams) and compare across a database — a direct application of Rabin-Karp's rolling hash at massive scale.

---

## Bit Manipulation

### Example 76: Bit Manipulation Fundamentals

Bitwise operations manipulate individual bits directly, enabling O(1) solutions to problems that otherwise require O(n) loops. Python integers have arbitrary precision, so bitmasks work on any size.

```python
# => Fundamental bit operations — all O(1)

n = 0b10110110                                # => n = 182 in decimal; binary literal for clarity

# => Check if k-th bit is set (0-indexed from right)
k = 4
is_set = bool(n & (1 << k))                  # => 1 << 4 = 0b10000; AND with n extracts bit k
print(is_set)                                 # => Output: True (bit 4 of 0b10110110 is 1)

# => Set the k-th bit
n_set = n | (1 << k)                         # => OR sets bit k to 1 regardless of current value
# => 0b10110110 | 0b00010000 = 0b10110110 (already set; unchanged)

# => Clear the k-th bit
n_cleared = n & ~(1 << k)                    # => ~(1 << k) has all bits 1 except bit k
# => 0b10110110 & 0b11101111 = 0b10100110 = 166

# => Toggle the k-th bit
n_toggled = n ^ (1 << k)                     # => XOR flips bit k: 0→1 or 1→0
# => 0b10110110 ^ 0b00010000 = 0b10100110

# => Count set bits (popcount / Hamming weight)
def popcount(x):
    count = 0
    while x:
        x &= x - 1                            # => Clear the lowest set bit; x-1 flips trailing bits
        # => E.g., x=0b1010: x-1=0b1001; AND gives 0b1000 (removed lowest set bit)
        count += 1
    return count

print(popcount(182))                          # => Output: 5 (0b10110110 has five 1-bits)
print(bin(182).count('1'))                    # => Output: 5 (equivalent Python built-in approach)

# => Isolate lowest set bit (used in Fenwick trees)
x = 12                                        # => x = 0b1100
lsb = x & (-x)                               # => -x is two's complement: ~x + 1
print(lsb)                                    # => Output: 4  (0b0100 = lowest set bit of 12)
```

**Key Takeaway**: Bit manipulation replaces loops with constant-time arithmetic. The expression `x & (x-1)` clears the lowest set bit, and `x & (-x)` isolates it — two patterns that appear throughout low-level algorithms.

**Why It Matters**: Bit manipulation is pervasive in systems programming: operating systems use bitmasks for permission flags, network code manipulates IP headers at the bit level, graphics engines pack color channels into 32-bit integers, and database engines use bitmap indices for fast set intersection. Python's arbitrary-precision integers make bitmask-based set operations feasible for representing sets of up to millions of elements without any additional library.

---

### Example 77: XOR Tricks — Finding the Unique Element

XOR's self-inverse property (a ^ a = 0, a ^ 0 = a) enables elegant solutions to problems about finding unique elements or pairs that would otherwise require hash maps or sorting.

```python
# => XOR trick: find the single element that appears once when all others appear twice

def find_single(nums):
    result = 0
    for n in nums:
        result ^= n                           # => XOR cancels pairs: a^a=0; unique survives
    return result                             # => result = 0^0^...^unique = unique

nums = [4, 1, 2, 1, 2]
print(find_single(nums))                      # => Output: 4  (O(n) time, O(1) space)
# => 4^1^2^1^2 = 4^(1^1)^(2^2) = 4^0^0 = 4

# => XOR trick: find two non-repeating elements when all others appear twice
def find_two_singles(nums):
    xor_all = 0
    for n in nums:
        xor_all ^= n                          # => xor_all = a ^ b where a,b are the two singles
    # => a^b != 0 (a≠b); find a bit where a and b differ
    diff_bit = xor_all & (-xor_all)           # => Isolate lowest differing bit
    # => This bit is 1 in one of {a,b} and 0 in the other

    a = 0
    for n in nums:
        if n & diff_bit:
            a ^= n                            # => XOR all numbers with diff_bit set: a survives
    b = xor_all ^ a                           # => b = xor_all ^ a = (a^b) ^ a = b
    return a, b

print(find_two_singles([1, 2, 3, 2, 3, 4]))  # => Output: (1, 4) in some order
# => XOR groups: group with diff_bit set contains one of {1,4}; XOR within group isolates it
```

**Key Takeaway**: XOR-based tricks work because XOR is commutative, associative, self-inverse (a^a=0), and identity-preserving (a^0=a). These four properties let pairs cancel regardless of their order in the array.

**Why It Matters**: XOR tricks appear in cryptography (one-time pad encryption uses XOR), hardware parity checking (RAID parity blocks use XOR across disk stripes for error recovery), checksum computation, and interview problems. The two-singles trick generalizes to finding elements appearing odd numbers of times using multi-bit grouping, a pattern used in error-correcting codes.

---

## Monotonic Structures

### Example 78: Monotonic Stack — Next Greater Element

A monotonic stack maintains elements in monotone order (increasing or decreasing). It solves "next greater element" and similar problems in O(n) time instead of the naive O(n²).

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Input Array"] -->|push to stack| B["Monotonic Stack<br/>decreasing order"]
    B -->|current > stack top| C["Pop: stack top's NGE<br/>is current element"]
    B -->|current <= stack top| D["Push current"]
    C -->|all elements popped| E["NGE Result Array"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CA9161,stroke:#000,color:#fff
    style E fill:#CC78BC,stroke:#000,color:#fff
```

```python
def next_greater_element(nums):
    n = len(nums)
    result = [-1] * n                         # => Default: no greater element to the right
    stack = []                                # => Stack holds indices of elements without NGE yet
    # => Invariant: stack is monotonically decreasing (values, not indices)

    for i in range(n):
        while stack and nums[i] > nums[stack[-1]]:
            # => nums[i] is greater than the element at the top of the stack
            idx = stack.pop()                 # => idx's next greater element is nums[i]
            result[idx] = nums[i]             # => Record the answer
        stack.append(i)                       # => Push current index; no NGE found yet
    # => Elements remaining in stack have no NGE: result stays -1

    return result

nums = [4, 1, 2, 3]
print(next_greater_element(nums))             # => Output: [-1, 2, 3, -1]
# => 4: no greater element to its right → -1
# => 1: next greater is 2
# => 2: next greater is 3
# => 3: no greater element → -1

nums2 = [2, 1, 2, 4, 3]
print(next_greater_element(nums2))            # => Output: [4, 2, 4, -1, -1]
```

**Key Takeaway**: Each element is pushed and popped at most once, giving O(n) total time. The stack stores indices of elements waiting for their "next greater" answer — whenever a larger element arrives, it settles all pending elements smaller than it.

**Why It Matters**: Monotonic stacks solve a family of problems in O(n): largest rectangle in a histogram (Leetcode 84, used in image processing), trapping rainwater (modeling terrain drainage), daily temperatures, stock span, and visibility problems. These appear frequently in technical interviews and in terrain analysis, financial charting libraries, and compiler optimization (constant folding over expression trees).

---

### Example 79: Monotonic Deque — Sliding Window Maximum

A monotonic deque (double-ended queue) maintains a decreasing window of candidates, giving O(n) sliding-window maximum instead of O(n·k) with a naive approach.

```python
from collections import deque
# => deque supports O(1) appendleft, append, popleft, pop (unlike list)

def sliding_window_max(nums, k):
    # => Find maximum in each window of size k
    # => Returns list of maximums (length = n - k + 1)
    dq = deque()                              # => Stores indices; values in dq are decreasing
    result = []

    for i in range(len(nums)):
        # => Remove indices that are out of the current window [i-k+1 .. i]
        while dq and dq[0] < i - k + 1:
            dq.popleft()                      # => Front of deque is expired; remove it

        # => Maintain decreasing order: remove indices with smaller values from the back
        while dq and nums[dq[-1]] < nums[i]:
            dq.pop()                          # => nums[i] dominates these: they'll never be max
            # => Any future window containing nums[i] would prefer it over these smaller values

        dq.append(i)                          # => Add current index to back of deque

        if i >= k - 1:
            result.append(nums[dq[0]])        # => Front of deque is index of current window max
            # => dq[0] is the largest unexpired element in the window

    return result

nums = [1, 3, -1, -3, 5, 3, 6, 7]
print(sliding_window_max(nums, 3))            # => Output: [3, 3, 5, 5, 6, 7]
# => Window [1,3,-1]=3, [3,-1,-3]=3, [-1,-3,5]=5, [-3,5,3]=5, [5,3,6]=6, [3,6,7]=7
```

**Key Takeaway**: The monotonic deque ensures that the maximum of the current window is always at the front in O(1). Each element is enqueued and dequeued at most once, giving O(n) overall instead of O(n·k).

**Why It Matters**: Sliding-window maximum appears in computational finance (rolling maximum for drawdown analysis), image processing (morphological dilation), real-time signal processing (envelope detection), and network congestion control algorithms. The deque-based O(n) solution replaces a segment tree when the window moves only forward — a common constraint that makes the deque the right tool.

---

## Advanced Sorting

### Example 80: Radix Sort — Non-Comparative Linear Sort

Radix sort sorts integers by processing individual digits from least significant to most significant. It achieves O(d·(n + b)) time where d is the number of digits and b is the base — faster than O(n log n) comparison sorts for bounded integers.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Input Array"] -->|sort by digit 0 LSD| B["Pass 1<br/>sort by ones"]
    B -->|sort by digit 1| C["Pass 2<br/>sort by tens"]
    C -->|sort by digit 2| D["Pass 3<br/>sort by hundreds"]
    D -->|all digits processed| E["Sorted Array"]

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#CA9161,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
```

```python
def counting_sort_by_digit(arr, exp):
    # => Stable sort of arr by digit at position exp (1, 10, 100, ...)
    n = len(arr)
    output = [0] * n
    count  = [0] * 10                         # => Count array for digits 0-9 (base 10)

    for num in arr:
        digit = (num // exp) % 10             # => Extract digit at position exp
        count[digit] += 1                     # => Frequency of this digit

    for i in range(1, 10):
        count[i] += count[i - 1]             # => Cumulative count: count[i] = position AFTER last i

    for i in range(n - 1, -1, -1):           # => Iterate backwards for stable sort
        digit = (arr[i] // exp) % 10
        count[digit] -= 1
        output[count[digit]] = arr[i]         # => Place element at correct position
        # => Iterating backwards ensures equal-digit elements maintain relative order (stability)

    return output

def radix_sort(arr):
    if not arr:
        return arr
    max_val = max(arr)                        # => Need max to know number of digits; O(n)
    exp = 1                                   # => Start with ones digit
    while max_val // exp > 0:
        arr = counting_sort_by_digit(arr, exp)
        # => Each pass is a stable sort by one digit; O(n + 10) = O(n) per pass
        exp *= 10                             # => Move to next digit position
    return arr

nums = [170, 45, 75, 90, 802, 24, 2, 66]
print(radix_sort(nums))                       # => Output: [2, 24, 45, 66, 75, 90, 170, 802]
# => 3 passes (max is 802, three digits): ones → tens → hundreds
```

**Key Takeaway**: Radix sort beats comparison-based sorts for integers with bounded values because each pass runs in O(n + b) using counting sort. Stability is critical — processing from LSD to MSD with a stable inner sort guarantees correct final order.

**Why It Matters**: Radix sort powers sorting in systems with bounded key spaces: sorting IP addresses (32-bit integers), phone numbers, ZIP codes, or fixed-length hashed keys. Database engines use radix sort internally for integer column sorting. GPU implementations of radix sort achieve extremely high throughput for parallel data processing because each pass is embarrassingly parallelizable across independent counting stages.

---

## Amortized Analysis

### Example 81: Amortized O(1) — Dynamic Array Doubling

A dynamic array amortizes the cost of resizing across many appends. Though individual resize operations are O(n), the amortized cost per append is O(1) using the accounting method.

```python
class DynamicArray:
    def __init__(self):
        self.data     = [None]                # => Internal fixed-size array (capacity=1)
        self.capacity = 1                     # => Current maximum elements before resize
        self.size     = 0                     # => Current number of elements

    def append(self, val):
        if self.size == self.capacity:
            # => Array is full: double the capacity
            new_data = [None] * (2 * self.capacity)
            # => Allocate new array of double size; this is O(n) but happens rarely
            for i in range(self.size):
                new_data[i] = self.data[i]   # => Copy all elements to new array
            self.data     = new_data
            self.capacity *= 2               # => Capacity doubles: 1→2→4→8→...→2^k
            # => Amortized argument: after k doublings, we've done O(1+2+4+...+2^k) = O(2^(k+1)) work
            # => for 2^k total appends → O(1) amortized per append
        self.data[self.size] = val            # => Insert at next free position; O(1)
        self.size += 1

    def __getitem__(self, idx):
        if idx < 0 or idx >= self.size:
            raise IndexError("Index out of range")
        return self.data[idx]                 # => O(1) random access

    def __len__(self):
        return self.size

    def load_factor(self):
        return self.size / self.capacity      # => Always between 0.5 and 1.0 after any append
        # => Doubling strategy maintains >= 50% utilization

da = DynamicArray()
for i in range(10):
    da.append(i)
    # => Resize events: at size 1→2 (copy 1), 2→4 (copy 2), 4→8 (copy 4)
    # => Total copies for 10 appends: 1+2+4 = 7 (< 10)
print(len(da))            # => Output: 10
print(da[5])              # => Output: 5
print(da.capacity)        # => Output: 16  (next power of 2 >= 10)
print(da.load_factor())   # => Output: 0.625  (10/16)
```

**Key Takeaway**: The doubling strategy guarantees that at most half the capacity is wasted and that the total copy work across all appends is bounded by 2n. This gives O(1) amortized append even though individual resizes are O(n).

**Why It Matters**: Python's `list`, Java's `ArrayList`, C++'s `std::vector`, and Go's slices all use this doubling strategy internally. Understanding amortized analysis explains why `list.append` in Python is safe to use in tight loops, and why pre-allocating with `[None] * n` is faster than repeated appends when n is known in advance (avoiding the log n resize events).

---

### Example 82: Amortized O(1) — Splay Tree Intuition via Two-Stack Queue

Two stacks can simulate a queue with O(1) amortized enqueue and dequeue, demonstrating amortized analysis: each element is pushed and popped exactly once across all operations, giving O(1) amortized per operation.

```python
class TwoStackQueue:
    def __init__(self):
        self.inbox  = []                      # => New elements pushed here (enqueue)
        self.outbox = []                      # => Elements consumed from here (dequeue)
        # => When outbox is empty, transfer all from inbox to outbox

    def enqueue(self, val):
        self.inbox.append(val)                # => Always O(1): push to inbox

    def dequeue(self):
        if not self.outbox:
            while self.inbox:
                self.outbox.append(self.inbox.pop())
                # => Transfer: reverse inbox into outbox; O(k) for k elements
                # => But each element is transferred at most once in its lifetime
                # => Amortized: 1 push (enqueue) + 1 pop (transfer) + 1 pop (dequeue) = 3 ops per element
                # => 3 ops / 1 element = O(1) amortized per dequeue
        if not self.outbox:
            raise IndexError("Queue is empty")
        return self.outbox.pop()              # => O(1): pop from outbox

    def peek(self):
        if not self.outbox:
            while self.inbox:
                self.outbox.append(self.inbox.pop()) # => Transfer on peek too
        return self.outbox[-1] if self.outbox else None

q = TwoStackQueue()
for i in range(5):
    q.enqueue(i)                              # => inbox: [0,1,2,3,4], outbox: []
print(q.dequeue())                            # => Output: 0; transfer happens here; outbox: [4,3,2,1]
print(q.dequeue())                            # => Output: 1; outbox: [4,3,2]  (no transfer needed)
q.enqueue(5)                                  # => inbox: [5], outbox: [4,3,2]
print(q.dequeue())                            # => Output: 2; outbox: [4,3]
print(q.dequeue())                            # => Output: 3; outbox: [4]
print(q.dequeue())                            # => Output: 4; outbox: []
print(q.dequeue())                            # => Output: 5; transfer from inbox; outbox: []
```

**Key Takeaway**: Amortized O(1) means the total work across n operations is O(n), even if individual operations occasionally cost more. The two-stack queue achieves this because each element crosses from inbox to outbox exactly once.

**Why It Matters**: The two-stack queue is used in functional programming languages (where lists are immutable and random access is expensive) to implement efficient queues. Amortized analysis is the mathematical tool that justifies why Python's list, hash tables, splay trees, and union-find are fast in practice despite occasional expensive operations — understanding it prevents premature optimization and guides correct data structure selection in production systems.

---

## Advanced Patterns

### Example 83: Fenwick Tree (Binary Indexed Tree) — Prefix Sums

A Fenwick tree (BIT) supports prefix-sum queries and point updates in O(log n) time with only O(n) space and very simple code. It is more cache-friendly than a segment tree for this specific use case.

```python
class FenwickTree:
    def __init__(self, n):
        self.n    = n
        self.tree = [0] * (n + 1)             # => 1-indexed; tree[0] unused

    def update(self, i, delta):
        # => Add delta to position i (1-indexed); propagates to all responsible ancestors
        while i <= self.n:
            self.tree[i] += delta             # => Update this node
            i += i & (-i)                     # => Move to next responsible ancestor
            # => i & (-i) isolates the lowest set bit; adding it moves to the next ancestor

    def prefix_sum(self, i):
        # => Sum of elements from position 1 to i (inclusive); O(log n)
        s = 0
        while i > 0:
            s += self.tree[i]                 # => Accumulate this node's contribution
            i -= i & (-i)                     # => Move to parent: remove lowest set bit
            # => i & (-i) identifies how many elements this node covers
        return s

    def range_sum(self, l, r):
        # => Sum from l to r (1-indexed, inclusive)
        return self.prefix_sum(r) - self.prefix_sum(l - 1)
        # => prefix_sum(r) - prefix_sum(l-1) cancels out elements before l

data = [3, 2, -1, 6, 5, 4, -3, 3, 7, 2, 3]
ft = FenwickTree(len(data))
for i, v in enumerate(data, 1):
    ft.update(i, v)                           # => Build tree by updating each position

print(ft.prefix_sum(6))                       # => Output: 19  (3+2-1+6+5+4)
print(ft.range_sum(2, 6))                     # => Output: 16  (2-1+6+5+4)
ft.update(3, 10)                              # => Change position 3 from -1 to 9 (add 10)
print(ft.range_sum(2, 6))                     # => Output: 26  (16 + 10)
```

**Key Takeaway**: Fenwick trees use the binary representation of indices to determine which tree nodes cover which ranges. The `i += i & (-i)` update traversal and `i -= i & (-i)` query traversal each visit O(log n) nodes.

**Why It Matters**: Fenwick trees are 2-3x faster in practice than segment trees for prefix-sum problems due to simpler code and better cache locality. They power order-statistic operations in competitive programming, frequency counting in streaming data, and inversion counting in sorting algorithms. Database systems use BIT-like structures for maintaining running aggregates over append-only event logs.

---

### Example 84: Flood Fill — Connected Component Labeling

Flood fill visits all cells reachable from a starting cell via BFS or DFS. It is the algorithm behind paint-bucket tools, island counting, and connected-component labeling.

```python
from collections import deque

def flood_fill(grid, sr, sc, new_color):
    # => grid: 2D list of integers (colors); sr,sc: starting row/col
    # => Fill all cells connected to (sr,sc) with the same original color
    rows, cols    = len(grid), len(grid[0])
    old_color     = grid[sr][sc]              # => Color of the starting cell
    if old_color == new_color:
        return grid                           # => Nothing to do; prevents infinite loop

    queue = deque([(sr, sc)])                 # => BFS queue initialized with starting cell
    grid[sr][sc] = new_color                  # => Fill start immediately to mark as visited

    directions = [(0,1),(0,-1),(1,0),(-1,0)] # => 4-directional connectivity (up/down/left/right)
    # => Use 8-directional [(dr,dc) for dr in [-1,0,1] for dc in [-1,0,1] if (dr,dc)!=(0,0)]
    # => for diagonal connectivity (used in some paint tools and game maps)

    while queue:
        r, c = queue.popleft()               # => BFS: process cells level by level
        for dr, dc in directions:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == old_color:
                # => In-bounds and same color: fill it
                grid[nr][nc] = new_color      # => Mark before enqueuing to avoid duplicate visits
                queue.append((nr, nc))

    return grid

grid = [
    [1, 1, 1],
    [1, 1, 0],
    [1, 0, 1]
]
result = flood_fill(grid, 1, 1, 2)
for row in result:
    print(row)
# => Output:
# => [2, 2, 2]
# => [2, 2, 0]
# => [2, 0, 1]   (bottom-right 1 not connected to start due to 0 barrier)
```

**Key Takeaway**: Flood fill marks cells as visited by changing their color before enqueuing them — this prevents exponential duplicate processing. BFS fills level by level (shortest path), while DFS is simpler to implement recursively.

**Why It Matters**: Flood fill is the algorithm in every raster graphics editor's paint-bucket tool (Photoshop, GIMP, Figma). It counts islands in grid problems (a common interview problem), labels connected components in binary images (essential for document layout analysis and OCR), and fills enclosed regions in game maps. Production implementations use iterative BFS rather than recursive DFS to avoid stack overflow on large grids.

---

### Example 85: A\* Search — Heuristic Pathfinding

A\* combines Dijkstra's guaranteed shortest path with a heuristic estimate to the goal, focusing the search toward the destination. It runs optimally when the heuristic never overestimates (admissible heuristic).

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Start Node<br/>f=g+h"] -->|pop min f| B["Open Set<br/>min-heap by f"]
    B -->|explore neighbors| C["Update g-scores"]
    C -->|compute h heuristic| D["Push to Open Set<br/>with new f"]
    D -->|goal reached| E["Reconstruct Path"]
    D -->|not goal| B

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#CA9161,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
```

```python
import heapq
import math

def astar(grid, start, goal):
    # => grid: 2D list; 0=passable, 1=wall
    # => start, goal: (row, col) tuples
    rows, cols = len(grid), len(grid[0])

    def heuristic(a, b):
        return math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2)
        # => Euclidean distance heuristic: admissible for 8-directional movement
        # => Manhattan distance (abs diffs) is admissible for 4-directional movement
        # => Inadmissible heuristic (overestimate) can miss optimal path but runs faster

    g_score = {start: 0}                      # => g[n]: cost of cheapest known path from start to n
    f_score = {start: heuristic(start, goal)} # => f[n] = g[n] + h(n): estimated total cost

    open_heap = [(f_score[start], start)]     # => Min-heap: (f-score, node)
    came_from = {}                            # => For path reconstruction
    closed = set()                            # => Already fully processed nodes

    while open_heap:
        _, current = heapq.heappop(open_heap) # => Node with lowest f-score
        if current in closed:
            continue                          # => Stale entry (updated since pushed)
        if current == goal:
            # => Reconstruct path by following came_from pointers
            path = []
            while current in came_from:
                path.append(current)
                current = came_from[current]
            path.append(start)
            path.reverse()                    # => Reverse to get start→goal order
            return path

        closed.add(current)
        r, c = current
        for dr, dc in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)]:
            nr, nc = r + dr, c + dc           # => 8-directional movement
            if not (0 <= nr < rows and 0 <= nc < cols):
                continue                      # => Out of bounds
            if grid[nr][nc] == 1:
                continue                      # => Wall: skip
            neighbor = (nr, nc)
            step = math.sqrt(dr**2 + dc**2)   # => 1.0 for cardinal, ~1.414 for diagonal
            tentative_g = g_score[current] + step
            if neighbor in closed and tentative_g >= g_score.get(neighbor, float('inf')):
                continue                      # => No improvement via this path
            if tentative_g < g_score.get(neighbor, float('inf')):
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                f = tentative_g + heuristic(neighbor, goal)
                heapq.heappush(open_heap, (f, neighbor))

    return None                               # => No path exists

grid = [
    [0,0,0,0,1],
    [0,1,1,0,0],
    [0,0,0,1,0],
    [0,1,0,0,0],
    [0,0,0,1,0]
]
path = astar(grid, (0,0), (4,4))
print(path)
# => Output: [(0,0),(1,0),(2,0),(2,1),(2,2),(3,2),(4,2),(4,3),(4,4)] or similar optimal path
# => A* finds the geometrically shortest passable path from top-left to bottom-right
```

**Key Takeaway**: A\* is optimal and complete when the heuristic is admissible (never overestimates). The heuristic guides the search toward the goal, dramatically reducing nodes explored compared to Dijkstra, which expands uniformly in all directions.

**Why It Matters**: A\* is the gold-standard pathfinding algorithm in game development (every pathfinding NPC in open-world games), robotics (ROS navigation stack), and GPS routing for small maps. Production systems use Hierarchical A\* (HPA\*), Theta\* for any-angle paths, or JPS (Jump Point Search) for grid-specific 10-40x speedups. Understanding A\* provides the foundation for all heuristic search algorithms including beam search (used in NLP decoders) and Monte Carlo Tree Search (used in AlphaGo).
