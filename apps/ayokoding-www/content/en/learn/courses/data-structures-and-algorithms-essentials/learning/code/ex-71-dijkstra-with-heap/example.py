"""Example 71: Dijkstra's Shortest Paths with a Min-Heap."""

# Dijkstra handles NONNEGATIVE weighted edges: a min-heap
# always expands the currently-cheapest-known node next (co-12, co-21).
import heapq  # => imports the stdlib binary-heap functions

graph: dict[
    str, list[tuple[str, int]]
] = {  # => node -> list of (neighbor, edge_weight)
    "a": [("b", 4), ("c", 1)],  # => from a: b costs 4 directly, c costs 1 directly
    "b": [("d", 1)],  # => from b: d costs 1
    "c": [("b", 2), ("d", 5)],  # => from c: b costs 2, d costs 5
    "d": [],  # => d has no outgoing edges -- a dead end
}  # => closes the adjacency dict literal


# Pops the cheapest frontier node each step -- once popped, its distance is FINAL.
def dijkstra(  # => a heap-driven shortest-path function
    graph: dict[str, list[tuple[str, int]]],
    start: str,  # => the graph plus the source node
) -> dict[str, int]:  # => returns node -> shortest distance from start
    for edges in graph.values():  # => validate the entire graph before searching
        for _, weight in edges:  # => visit each edge once, O(E)
            if weight < 0:  # => Dijkstra cannot finalize distances with negative edges
                raise ValueError("Dijkstra requires nonnegative edge weights")
    distances: dict[str, int] = {start: 0}  # => best known distance to each node so far
    heap: list[tuple[int, str]] = [
        (0, start)
    ]  # => (distance, node) -- heapq sorts by distance
    while heap:  # => O(log n) pop per iteration, at most one pop per push
        dist, node = heapq.heappop(
            heap
        )  # => always the cheapest unexpanded frontier entry
        if dist > distances.get(node, float("inf")):  # => a stale, already-beaten entry
            continue  # => skip it -- a shorter path to node was already found and processed
        for neighbor, weight in graph[node]:  # => relax every outgoing edge from node
            new_dist = dist + weight  # => cost of reaching neighbor THROUGH node
            if new_dist < distances.get(
                neighbor, float("inf")
            ):  # => a strictly better path
                distances[neighbor] = new_dist  # => record the improved distance
                heapq.heappush(
                    heap, (new_dist, neighbor)
                )  # => push the improved candidate
    return distances  # => the shortest known distance to every reachable node


result = dijkstra(
    graph, "a"
)  # => a->c->b (1+2=3) beats a->b directly (4), so b costs 3
print(result)  # => Output: {'a': 0, 'b': 3, 'c': 1, 'd': 4}
# => dict order reflects each key's FIRST-set order (co-08): b before c, even though
# => b's distance is later UPDATED from 4 to 3 -- updates never move a key's position

assert result["a"] == 0  # => confirms the start node's distance to itself is 0
assert (
    result["b"] == 3
)  # => confirms a->c->b (cost 3) beat the direct a->b edge (cost 4)
assert result["d"] == 4  # => confirms a->c->b->d (1+2+1=4) is the cheapest route to d
assert (
    dijkstra({"a": [("b", 0)], "b": []}, "a")["b"] == 0
)  # => zero-cost edges are valid
try:  # => prove that unsupported negative edge weights fail clearly
    dijkstra({"a": [("b", -1)], "b": []}, "a")
except ValueError as exc:  # => a negative edge must be rejected, not miscomputed
    assert str(exc) == "Dijkstra requires nonnegative edge weights"
else:  # => guard against accepting a graph outside Dijkstra's precondition
    raise AssertionError("negative edge weight was accepted")
print("ex-71 OK")  # => Output: ex-71 OK
