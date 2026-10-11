---
title: "Overview"
date: 2026-07-27T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to the Graph Databases primer: five fixed drills that
force active recall instead of passive re-reading. Work through them in order -- short-answer recall
first, then scenario judgment, then hands-on repetition against small, hand-traced Cypher fixtures,
then a checklist to confirm real automaticity, and finally why/why-not prompts that test whether you
can explain the reasoning -- including this topic's cross-cutting big ideas,
`consistency-latency-throughput` and `coupling-vs-cohesion` -- not just execute the syntax. Every
answer is hidden in a `<details>` block; try each item yourself before opening it.

## Recall Q&A

Twenty-six short-answer questions, one per concept (`co-01` through `co-26`). Answer from memory,
then check.

**Q1 (co-01 -- property-graph-model).** What is a property graph built from, and what is the
smallest possible fact you can write in one?

<details>
<summary>Answer</summary>

A property graph is built from nodes, relationships, labels, and properties as first-class citizens.
The smallest fact is a single labeled node carrying a bag of key-value properties (Example 1) -- an
identity via the label, and a set of typed facts about it, with no fixed column schema constraining
what properties any other node with the same label must carry.

</details>

**Q2 (co-02 -- labeled-property-graph-vs-rdf).** How does a labeled-property graph differ from an
RDF triple store in what a single "fact" even is?

<details>
<summary>Answer</summary>

In a labeled-property graph, a fact is usually bundled into a node object -- a node's label plus its
properties, in one addressable unit (Example 1). In RDF, every fact -- including what a property
graph would call a "property" -- is its own standalone subject-predicate-object triple (Example 25);
there is no single node object bundling a resource's facts together, only however many triples happen
to share that resource as their subject.

</details>

**Q3 (co-03 -- when-graph-beats-relational).** What specific shape of question is where a graph
traversal beats a relational join chain, and where does it NOT necessarily win?

<details>
<summary>Answer</summary>

Deeply connected, relationship-heavy, variable-depth questions -- "friends of friends of friends," a
bill-of-materials explosion, a knowledge-graph chain across several entity types -- are where a graph
traversal wins, because the query's shape barely changes as the hop count grows (Example 19, Example
38, Example 65). A graph database is not a universal replacement for a relational store; the win is
specific to traversal-heavy questions, not every kind of query.

</details>

**Q4 (co-04 -- index-free-adjacency).** What does "index-free adjacency" mean, and what does it
guarantee -- and NOT guarantee -- about a traversal's cost?

<details>
<summary>Answer</summary>

Each node stores a direct pointer to its own relationships, so expanding one hop from a node costs
roughly the same regardless of the graph's total size (Example 18) -- the cost tracks the node's own
neighborhood, not the whole database. It does NOT guarantee that neighborhood stays small: a node
with an unusually high degree (a supernode) still has to enumerate all of its own relationships, so
the flat-cost guarantee is scoped to "proportional to the starting node's own degree," not "constant
time no matter what" (Example 44).

</details>

**Q5 (co-05 -- cypher-read-clauses).** Name Cypher's core read pipeline and what each clause does.

<details>
<summary>Answer</summary>

`MATCH`/`WHERE`/`RETURN` -- `MATCH` finds every subgraph matching a drawn pattern, `WHERE` filters
those matches down to the rows satisfying a boolean condition, and `RETURN` projects what actually
comes back (Example 4, Example 5, Example 6). Every later, more complex read query --
`OPTIONAL MATCH`, `WITH`-pipelines, `CALL {}` subqueries -- extends this same three-clause shape
rather than replacing it.

</details>

**Q6 (co-06 -- cypher-write-clauses).** How does `CREATE` differ from `MERGE`, and what do
`ON CREATE`/`ON MATCH` add?

<details>
<summary>Answer</summary>

`CREATE` unconditionally writes the pattern every time it runs -- rerunning it twice leaves two nodes
(Example 1). `MERGE` matches the pattern if it already exists, and only creates it if it does not --
rerunning the same `MERGE` twice still leaves exactly one node (Example 10). `ON CREATE SET`/
`ON MATCH SET` let one `MERGE` statement branch on which path it actually took, e.g. setting a
first-seen timestamp only on creation and incrementing a counter only on a repeat match (Example 11).

</details>

**Q7 (co-07 -- relationship-direction-and-type).** Why does getting a relationship's direction or
type wrong in a pattern typically fail silently rather than error?

<details>
<summary>Answer</summary>

A Cypher relationship pattern (`()-[:REL]->()`) is directed and typed, and both narrow what a `MATCH`
finds (Example 3, Example 6, Example 7). Reversing the arrow or naming the wrong type against real
data simply matches zero rows instead of raising an error -- there is nothing structurally wrong
about the query, it is just describing a shape that does not exist in the graph, which is why Example
9's deliberately direction-agnostic `()--()` pattern exists for when direction genuinely does not
matter.

</details>

**Q8 (co-08 -- pattern-matching).** What does it mean for Cypher's `MATCH` to be "declarative," and
what does the engine do that a relational join-based approach makes the query author do by hand?

<details>
<summary>Answer</summary>

A Cypher query describes a graph shape, and the engine -- not the query author -- enumerates every
place in the graph that shape actually occurs (Example 6). A multi-hop relational equivalent instead
requires the author to hand-write one additional self-join per hop (Example 19); Cypher's pattern
stays a single `MATCH` regardless of hop count, with only the bound inside `*` changing.

</details>

**Q9 (co-09 -- variable-length-and-quantified-paths).** Name the two syntaxes for a variable-length
path, and why bounding one matters.

<details>
<summary>Answer</summary>

The classic `[:REL*1..3]` syntax (still valid, not GQL-conformant) and the modern
quantified-relationship syntax `-[:REL]->{1,3}` (GQL-conformant, Cypher 25) both traverse a variable
number of hops in one pattern (Example 14, Example 15). Bounding the traversal (`*1..3` rather than
unbounded `*`) keeps the query's cost predictable -- an unbounded `*` risks scanning the entire
connected component, which is why `shortestPath()`'s internal use of unbounded `*` is safe
specifically because the function stops at the first shortest match, while the same unbounded `*` in
a plain `MATCH` is a performance hazard.

</details>

**Q10 (co-10 -- shortest-path-queries).** What is the difference between a hop-counting shortest path
and a weighted shortest path, and which Neo4j feature computes each?

<details>
<summary>Answer</summary>

`shortestPath()`/`allShortestPaths()` (Example 16, Example 17) and the modern `SHORTEST`/
`ALL SHORTEST`/`ANY` path selectors (Example 79) count hops -- "fewest hops between these two nodes."
`gds.shortestPath.dijkstra`/`gds.allShortestPaths.dijkstra` (Example 60, Example 61) minimize total
edge weight instead -- "cheapest total cost," which can favor a longer-hop-count route if its summed
weight is lower (Example 60's A-C-Z route beating the equal-hop-count but heavier A-B-Z route).

</details>

**Q11 (co-11 -- graph-modeling-nodes-vs-properties-vs-relationships).** What is the central
graph-modeling decision this course teaches, and what triggers moving a fact from one form to
another?

<details>
<summary>Answer</summary>

Deciding whether a fact becomes a node, a property, or a relationship -- because that decision
determines what a later query can traverse to directly (Example 12, Example 13). A fact stays a
property when it is only ever read, never traversed into, and has no attributes of its own (Example
12); it graduates to its own node the moment it needs attributes of its own or needs to be a target
other entities also point at (Example 54). A fact about the connection itself, not either endpoint,
belongs on the relationship (Example 13).

</details>

**Q12 (co-12 -- many-to-many-modeling).** What does a Cypher relationship replace from a relational
many-to-many design, and what can it do that a plain foreign-key join table cannot?

<details>
<summary>Answer</summary>

A relationship replaces a join table outright -- the many-to-many fact IS the edge, with no separate
junction table to design, index, or join through (Example 33). Unlike a plain foreign-key join table,
a relationship can carry its own properties directly (a grade, a rating, a timestamp), attached
exactly to the one pairing it describes, with no extra column needed on a junction row (Example 34).

</details>

**Q13 (co-13 -- hierarchical-tree-modeling).** How does the SAME relationship type answer both "who
is above me" and "who is below me" in an org chart?

<details>
<summary>Answer</summary>

A directed `[:REPORTS_TO]` relationship walked forward with an unbounded `*` answers "who do I
ultimately report to" (Example 35); the identical relationship type walked with the arrow reversed
answers "who reports to me, directly or indirectly" (Example 36). No second relationship type or
schema change is needed -- only the direction the pattern is walked changes.

</details>

**Q14 (co-14 -- bill-of-materials-modeling).** Why is a bill-of-materials a canonical variable-depth
graph problem, and what does the Cypher version avoid that a recursive SQL CTE requires?

<details>
<summary>Answer</summary>

A BOM is recursive by nature -- assemblies containing sub-assemblies containing parts, to arbitrary
depth (Example 37). A recursive SQL CTE must be written explicitly as a base case plus a recursive
`UNION ALL` step that the author keeps in sync with the schema (Example 38); `[:PART_OF*]` expresses
the identical recursive structure as one pattern, shifting that bookkeeping into the query engine
itself.

</details>

**Q15 (co-15 -- recommendation-queries).** What is the underlying shape of a "people who bought X
also bought Y" recommendation query, and how does GDS's node similarity improve on a hand-rolled
overlap count?

<details>
<summary>Answer</summary>

It is fundamentally a co-occurrence pattern: through what a user bought, out to who else bought it,
out to what else they bought, excluding anything the user already owns (Example 39). A hand-rolled
minimum-overlap threshold (Example 40) treats every co-buyer above the cutoff the same;
`gds.nodeSimilarity` (Example 59) instead produces a continuous Jaccard-style similarity score,
letting Example 62 pick specifically the MOST similar co-buyer rather than any co-buyer clearing a
fixed bar.

</details>

**Q16 (co-16 -- fraud-pattern-detection).** Name two structural fraud signatures this course covers,
and what surfaces each one.

<details>
<summary>Answer</summary>

A shared-attribute ring -- two accounts that should be independent sharing a device or identifier --
surfaces as a two-hop pattern match with an inequality filter excluding self-matches (Example 41). A
circular-payment cycle -- money flowing back to its own origin -- surfaces by binding both ends of a
variable-length pattern to the same starting variable (Example 42). Example 63 combines both ideas
with Louvain community detection, flagging an unusually dense, self-contained cluster as a possible
ring.

</details>

**Q17 (co-17 -- supernodes-and-the-dense-node-problem).** What is a supernode, and why does
index-free adjacency not protect against its traversal cost?

<details>
<summary>Answer</summary>

A supernode is a node whose relationship count (degree) massively exceeds its neighbors' (Example
43). Index-free adjacency guarantees a hop's cost tracks the STARTING node's own degree, not the
graph's total size (co-04) -- but that guarantee says nothing about how large that one node's own
degree happens to be, so expanding through a 50,000-relationship supernode genuinely enumerates
50,000 relationships, measurably slower than an ordinary node (Example 44). Example 72's mitigation
is refactoring the supernode's edges through an intermediate grouping node.

</details>

**Q18 (co-18 -- graph-sharding-challenges).** Why does sharding a connected graph differ fundamentally
from sharding independent rows?

<details>
<summary>Answer</summary>

Sharding independent rows (say, by customer ID) never needs a cross-shard join, because rows
genuinely do not reference each other. A densely connected graph has no such guarantee -- any
partition boundary drawn is likely to cut real relationships (Example 45), and every cut relationship
becomes a network round trip at query time instead of a local, in-memory pointer follow. Example 73
shows a community-aware split minimizing that cut versus a naive ID-range split that has no such
guarantee.

</details>

**Q19 (co-19 -- acid-transactions-in-graph-databases).** What guarantee does a Neo4j driver
transaction give across multiple writes, and how is that different from eventual consistency?

<details>
<summary>Answer</summary>

Neo4j operations run inside fully ACID transactions -- an exception raised partway through a
multi-write transaction rolls back EVERY write already attempted in that same transaction, not just
the failing one (Example 22). This is a genuinely different guarantee from eventual consistency
common elsewhere in NoSQL: Neo4j also detects concurrent conflicting writes to the same node via
locking, forcing one transaction to fail or retry rather than silently letting the second write
corrupt the first (Example 74).

</details>

**Q20 (co-20 -- bulk-import-and-loading).** Name the two bulk-loading paths this course covers and
when each one is the right choice.

<details>
<summary>Answer</summary>

`LOAD CSV` (Example 23) runs online, row-at-a-time, inside the normal transactional write path,
typically paired with `MERGE` for idempotent reruns -- the right tool for routine, ongoing loads of a
few thousand rows. `neo4j-admin database import full` (Example 24) loads an entire fresh database
offline, against a stopped and empty target, by writing storage files directly at far higher
throughput -- the right tool for an initial bulk load of millions of rows, at the cost of needing
dedicated `:ID`/`:START_ID`/`:END_ID`/`:TYPE` CSV headers and only running against an empty database.

</details>

**Q21 (co-21 -- neo4j-versioning-and-editions).** What are Cypher 5 and Cypher 25, and how do you pin
a query to one explicitly?

<details>
<summary>Answer</summary>

Neo4j ships two parallel Cypher dialects: Cypher 5, frozen and bug-fixes-only, and Cypher 25,
evolving (Example 52, Example 53) -- see the course overview's dated
[References](../overview.md#references) for the calendar version at which Cypher 25 became
the default, since that specific detail moves release to release. Prefixing a query with `CYPHER 5`
or `CYPHER 25` pins that one statement to the named dialect regardless of the database's own
configured default -- Example 15's quantified-relationship syntax and Example 79's `SHORTEST`
selector are Cypher-25-only features that would not be available under a query pinned to Cypher 5.

</details>

**Q22 (co-22 -- constraints-and-indexes).** What is the difference between `CREATE CONSTRAINT` and
`CREATE INDEX`, and what does the schema-optional default mean for uniqueness?

<details>
<summary>Answer</summary>

A uniqueness constraint (`CREATE CONSTRAINT ... IS UNIQUE`) is enforced eagerly at write time,
rejecting a duplicate value before it is ever written (Example 20); an index (`CREATE INDEX`)
accelerates property lookups without enforcing anything, confirmed by `EXPLAIN` showing
`NodeIndexSeek` instead of a full label scan (Example 21). Property graphs are schema-optional by
default -- without an explicit constraint, nothing stops two nodes from carrying an identical
"unique" value (Example 1), which is why Example 75 shows a bulk import tool's own id-uniqueness
check catching a different problem than a real property-level constraint would.

</details>

**Q23 (co-23 -- aggregation-and-pipelining).** Name at least three of the clauses in Cypher's
aggregation/pipelining toolkit and what each does.

<details>
<summary>Answer</summary>

Any three of: `WITH`, which passes computed values forward into the next query stage, letting a query
filter on an aggregate result the way `WHERE` alone cannot (Example 28); `UNWIND`, which expands a
list into one row per element (Example 29); `count()`/`collect()`, which reduce a group of rows to a
number or a list respectively, grouping implicitly by whatever is not aggregated (Example 30);
`ORDER BY`/`LIMIT`/`SKIP`, the standard paging triple (Example 31); or `CALL (var) { ... }`, a
correlated subquery scoped explicitly to the outer variables passed in (Example 32).

</details>

**Q24 (co-24 -- rdf-triples-and-sparql).** What does SPARQL's `SELECT ... WHERE { ... }` do, and how
does it structurally resemble Cypher's `MATCH`?

<details>
<summary>Answer</summary>

`WHERE` matches a triple pattern -- subject, predicate, and a variable in the object position --
binding that variable to every object that completes the pattern for every matching triple (Example
26). Structurally this is the same idea as Cypher's `MATCH` binding a variable to every node
completing a graph pattern (Example 6) -- both are declarative pattern-matching, just over triples
versus labeled nodes and relationships. `OPTIONAL`/`FILTER` (Example 50) mirror Cypher's
`OPTIONAL MATCH`/`WHERE`, and `CONSTRUCT` (Example 76) builds a new graph of triples from a matched
pattern rather than returning tabular bindings.

</details>

**Q25 (co-25 -- gremlin-traversal-language).** How does Gremlin's query style differ from Cypher's,
and name two of its core traversal steps.

<details>
<summary>Answer</summary>

Gremlin (Apache TinkerPop) is imperative and step-chained -- `addV()`, `addE().from().to()`, `has()`,
`out()`, `repeat().times()`/`repeat().until()` -- rather than Cypher's single declarative pattern
(Example 46, Example 47, Example 48). `has()` filters a vertex set the same way an inline
`{property: value}` filter narrows a Cypher `MATCH`; `out('type')` steps one hop forward along a
named edge label, the Gremlin equivalent of a directed, typed Cypher relationship pattern. Gremlin is
portable across many graph engines beyond Neo4j (JanusGraph, Amazon Neptune, and others).

</details>

**Q26 (co-26 -- graph-data-science-procedures).** Why do GDS algorithms run against an in-memory
graph PROJECTION rather than the live transactional graph directly, and name three algorithm families
this course covers?

<details>
<summary>Answer</summary>

Running centrality, community-detection, or similarity algorithms directly against the live
transactional graph on every call would be prohibitively slow at scale -- `gds.graph.project` builds
a stable, named in-memory snapshot once, up front, that every later `gds.*` call in the same session
refers back to by name (Example 55). Three algorithm families: centrality (PageRank, Example 56;
betweenness, Example 57), community detection (Louvain, Example 58), and weighted shortest path
(Dijkstra, source-target and single-source, Example 60/Example 61) -- alongside node similarity
(Example 59).

</details>

## Applied problems

Thirteen scenarios. Each describes a task without naming the construct -- decide which Cypher
feature, GDS procedure, or modeling decision solves it, then check.

**AP1.** An org-chart feature needs to walk from an individual contributor all the way up to the CEO,
but nobody knows in advance how many management layers deep that chain actually goes for any given
person.

<details>
<summary>Answer</summary>

An unbounded variable-length pattern, `[:REPORTS_TO*]`, walked upward. It traverses as far as the
chain actually goes without needing to know the depth in advance (co-09, co-13; Example 35).

</details>

**AP2.** A nightly sync script loads a list of people from an external system and needs to be safely
re-runnable after a partial failure, without doubling every person already loaded.

<details>
<summary>Answer</summary>

`MERGE`, not `CREATE`. `MERGE` matches an already-loaded node instead of creating a second one, so a
retried run is a genuine no-op (co-06; Example 10, Example 66).

</details>

**AP3.** A staffing report needs to list every `Person` alongside any `Movie` they directed, but
people who have directed nothing keep vanishing from the report entirely instead of appearing with a
blank movie column.

<details>
<summary>Answer</summary>

`OPTIONAL MATCH` in place of a second plain `MATCH`. A plain `MATCH` behaves like an inner join and
drops any row where the second pattern finds nothing; `OPTIONAL MATCH` preserves it with `NULL`
instead (co-05; Example 27).

</details>

**AP4.** A fraud team needs to find two different customer accounts that both use the exact same
registered device ID -- a red flag no single row alone reveals.

<details>
<summary>Answer</summary>

A two-hop shared-attribute pattern, `(a)-[:USES]->(d)<-[:USES]-(b)`, with a `WHERE a <> b` filter
excluding a device matching against itself (co-16, co-08; Example 41).

</details>

**AP5.** A search feature accepts a free-text account name from a public web form and needs to embed
it into a Cypher `WHERE name = ...` clause safely, without giving an attacker a way to inject
arbitrary Cypher through the input box.

<details>
<summary>Answer</summary>

A bound parameter (`$name`), never f-string/`.format` interpolation into the query text -- the same
discipline followed throughout this course's Python driver examples (Example 18's `n=n`, Example 44's
`name=name`, and every capstone-preview script). The driver binds the value as an opaque parameter, so
nothing it contains can change the query's shape.

</details>

**AP6.** A dashboard currently loads every `Team` node, then for each team separately issues a second
query to fetch just that team's players -- a query log shows far more round trips than a single page
of data should need.

<details>
<summary>Answer</summary>

A single `MATCH (t:Team)<-[:PLAYS_FOR]-(p:Player)` with `collect(p.name)`, or a `CALL (t) { ... }`
subquery scoped per team -- either replaces the per-team loop with one round trip that returns every
team's player list already grouped (co-23; Example 30, Example 32).

</details>

**AP7.** A recommendation report keeps surfacing weak, coincidental one-item purchase overlaps as if
they were as trustworthy as a customer who overlaps on ten separate items.

<details>
<summary>Answer</summary>

Either a `WITH ... count(DISTINCT shared) AS overlap WHERE overlap >= N` threshold (co-15, co-23;
Example 40), or the more principled fix, `gds.nodeSimilarity`'s continuous Jaccard-style score, which
lets a query rank co-buyers by strength instead of applying one fixed cutoff (co-26, co-15; Example
59, Example 62).

</details>

**AP8.** A migration needs to guarantee `Person.name` is unique going forward, and separately confirm
the query planner is actually using an index when filtering by a person's birth year, rather than
scanning every `Person` node.

<details>
<summary>Answer</summary>

`CREATE CONSTRAINT ... IS UNIQUE` for the first requirement, and `CREATE INDEX` plus an `EXPLAIN`
check confirming `NodeIndexSeek` (rather than a full label scan) for the second -- two different
guarantees from two different statements (co-22; Example 20, Example 21).

</details>

**AP9.** An application performs two related graph writes inside one driver transaction; the second
write fails a constraint check, and the team needs confirmation that the first write does not
silently survive on its own.

<details>
<summary>Answer</summary>

Neo4j's ACID transaction guarantee: an exception raised anywhere inside `execute_write`'s wrapped
function rolls back every write already attempted in that same transaction, not just the failing one
(co-19; Example 22).

</details>

**AP10.** Two application servers each increment the SAME shared counter node at nearly the same
instant, and the team needs confirmation Neo4j will not silently let one write overwrite the other
without either transaction knowing about the conflict.

<details>
<summary>Answer</summary>

Neo4j's per-node write locking. Two overlapping transactions writing the same node cannot both hold
the lock simultaneously -- one is forced to fail with a catchable exception (or retry), never a
silent lost update (co-19; Example 74).

</details>

**AP11.** A dataset of several million rows needs to be loaded once, from scratch, into a brand-new
empty database, and the routine online loading path is too slow for the volume involved.

<details>
<summary>Answer</summary>

`neo4j-admin database import full`, the offline, whole-database import path -- it writes storage
files directly, bypassing the normal transactional write path, but only runs against a stopped, empty
target (co-20; Example 24).

</details>

**AP12.** A team is migrating queries onto the newest GQL-conformant Cypher features, but a handful of
older, unmigrated queries need to keep behaving exactly as they always have, even after the
database's own default dialect eventually changes.

<details>
<summary>Answer</summary>

Prefix those specific queries with `CYPHER 5` to pin them to the frozen dialect explicitly, regardless
of whatever the database's own configured default becomes later (co-21; Example 52).

</details>

**AP13.** A "how far apart are these two people" feature is measurably slow, and profiling shows the
query's pattern happens to expand through a celebrity account with tens of thousands of followers as
one of its intermediate hops, even though that account is not actually relevant to the question being
asked.

<details>
<summary>Answer</summary>

Identify the supernode by degree (`COUNT { (n)--() }`) and restructure the pattern to avoid routing
through it unnecessarily -- either by matching through a narrower, more specific intermediate node
instead, or, for a genuinely unavoidable supernode, refactoring its edges through an intermediate
grouping node (co-17, co-04; Example 43, Example 44, Example 72).

</details>

## Code katas

Seven hands-on repetition drills against small, self-contained fixtures -- six against Cypher run
through `cypher-shell`, one against a Python driver script. Each is a before/after `.cypher` or typed
`.py` file colocated under `drilling/code/`. Every "before" script is real and misapplies a concept
this course teaches -- run it yourself (or, for the one script that needs a live Neo4j server, trace
it by hand exactly the way this course's own Verify blocks do), diagnose the bug from the observed
output, fix it from memory, then compare your fix against the "after" script and the model solution
before checking your work against the shown output.

### Kata 1 -- undirected match returns unintended extra rows

**Task.** A feed feature is meant to show only the people Ada actively FOLLOWS -- a directed
relationship. The version below matches the relationship without an arrowhead, so it also picks up
the person who follows Ada, not just the person Ada follows.

**Before** (`drilling/code/kata-01-undirected-match-extra-rows/before/kata.cypher`)

```cypher
// Kata 1 (before): an undirected pattern matches a FOLLOWS edge from EITHER side,
// not just the direction the query actually needs.
CREATE (ada:Person {name: 'Ada'})-[:FOLLOWS]->(:Person {name: 'Bob'})
// => Ada FOLLOWS Bob -- this is the ONE person the report is supposed to surface
CREATE (:Person {name: 'Cid'})-[:FOLLOWS]->(ada);
// => Cid FOLLOWS Ada, the OPPOSITE direction -- Ada does NOT follow Cid back

// intent: list only the people ADA FOLLOWS.
MATCH (a:Person {name: 'Ada'})--(other:Person)
// BUG: no arrowhead -- this matches the FOLLOWS edge from EITHER endpoint's side
RETURN other.name
ORDER BY other.name;
```

**Observed (buggy) output** (hand-traced -- both Bob and Cid satisfy the undirected pattern, even
though Cid's edge actually points INTO Ada, not out of her):

```text
+-------------+
| other.name  |
+-------------+
| "Bob"       |
| "Cid"       |
+-------------+
2 rows
```

**After** (`drilling/code/kata-01-undirected-match-extra-rows/after/kata.cypher`)

```cypher
// Kata 1 (after): the arrowhead restores the ONE direction the report actually needs.
CREATE (ada:Person {name: 'Ada'})-[:FOLLOWS]->(:Person {name: 'Bob'})
CREATE (:Person {name: 'Cid'})-[:FOLLOWS]->(ada);

// THE FIX: -[:FOLLOWS]-> requires the SAME direction the data was created with.
MATCH (a:Person {name: 'Ada'})-[:FOLLOWS]->(other:Person)
RETURN other.name
ORDER BY other.name;
```

<details>
<summary>Model solution</summary>

```cypher
// THE FIX: -[:FOLLOWS]-> (co-07) requires the SAME direction as the data was written
// with -- Cid's FOLLOWS edge points the OTHER way, so it no longer fits this pattern.
MATCH (a:Person {name: 'Ada'})-[:FOLLOWS]->(other:Person)
RETURN other.name
ORDER BY other.name;

// => only Bob -- Cid's edge points INTO Ada, not out of her, so it is correctly excluded
```

**Root cause**: An undirected pattern `(a)--(b)` (Example 9) matches a stored relationship from
either endpoint's perspective -- Cid's `[:FOLLOWS]->` edge into Ada satisfies `(a)--(other)` exactly
as readily as Ada's own outgoing edge to Bob does, because dropping the arrowhead drops direction as a
filtering criterion entirely. Restoring the arrowhead (`-[:FOLLOWS]->`) makes direction part of the
pattern's shape again, exactly as Example 3 and Example 6 establish it, and Cid's reversed edge simply
does not fit.

**Run**: `cypher-shell < kata.cypher`

**Output**:

```text
+------------+
| other.name |
+------------+
| "Bob"      |
+------------+
1 row
```

</details>

### Kata 2 -- CREATE where MERGE was needed

**Task.** A nightly script is meant to load a small roster of people, safely re-runnable if the job
is retried after a failure. The version below uses `CREATE`, so a retry duplicates every person
instead of leaving the roster unchanged.

**Before** (`drilling/code/kata-02-create-instead-of-merge/before/kata.cypher`)

```cypher
// Kata 2 (before): CREATE writes unconditionally -- a retried run duplicates every row.
UNWIND ['Ada', 'Grace'] AS name
CREATE (:Person {name: name});
// => first run: 2 new Person nodes

// simulate a RETRY of the exact same load script after, say, a network blip --
// this is the SAME statement, run a second time within this one file.
UNWIND ['Ada', 'Grace'] AS name
CREATE (:Person {name: name});
// BUG: CREATE has no concept of "this row is already loaded" -- it writes again regardless

MATCH (p:Person)
RETURN count(p) AS person_count;
```

**Observed (buggy) output**:

```text
+---------------+
| person_count  |
+---------------+
| 4             |
+---------------+
1 row
```

**After** (`drilling/code/kata-02-create-instead-of-merge/after/kata.cypher`)

```cypher
// Kata 2 (after): MERGE is idempotent -- a retried run leaves the roster unchanged.
UNWIND ['Ada', 'Grace'] AS name
MERGE (:Person {name: name});
// => first run: no matching nodes exist yet, so MERGE creates both

// the SAME retry simulation as the buggy version -- this time with MERGE.
UNWIND ['Ada', 'Grace'] AS name
MERGE (:Person {name: name});
// THE FIX: MERGE matches the already-loaded nodes instead of creating new ones

MATCH (p:Person)
RETURN count(p) AS person_count;
```

<details>
<summary>Model solution</summary>

```cypher
// THE FIX: MERGE (co-06) matches a node that already exists instead of creating a
// second one -- rerunning the identical load twice still leaves exactly 2 nodes.
UNWIND ['Ada', 'Grace'] AS name
MERGE (:Person {name: name});

MATCH (p:Person)
RETURN count(p) AS person_count;

// => person_count is 2, not 4 -- the retry was a genuine no-op
```

**Root cause**: `CREATE` (Example 1) unconditionally writes the pattern every time it runs -- it has
no way to know a matching node was already loaded by an earlier attempt, so a retried script simply
doubles every row. `MERGE` (Example 10) matches the pattern first and only creates it if no match
exists, which is exactly the idempotency a re-runnable loading script needs.

**Run**: `cypher-shell < kata.cypher`

**Output**:

```text
+---------------+
| person_count  |
+---------------+
| 2             |
+---------------+
1 row
```

</details>

### Kata 3 -- inner MATCH drops unmatched rows

**Task.** A staffing report is meant to list every `Person` alongside any `Movie` they directed,
including people who have directed nothing (shown with a blank movie). The version below's second
`MATCH` silently drops anyone with zero `DIRECTED` edges instead of keeping them in the output.

**Before** (`drilling/code/kata-03-inner-match-drops-unmatched/before/kata.cypher`)

```cypher
// Kata 3 (before): a plain second MATCH behaves like an inner join -- it drops
// anyone whose DIRECTED pattern finds nothing, instead of keeping their row.
CREATE (:Person {name: 'Ada'});
// => Ada has directed NOTHING -- expected to still appear in the report
CREATE (:Person {name: 'Grace'})-[:DIRECTED]->(:Movie {title: 'Compile Error'});
// => Grace directed exactly one movie

MATCH (p:Person)
// => matches BOTH Ada and Grace so far
MATCH (p)-[:DIRECTED]->(m:Movie)
// BUG: a second plain MATCH requires the pattern to ALSO match, dropping Ada entirely
RETURN p.name, m.title;
```

**Observed (buggy) output**:

```text
+---------+-------------------+
| p.name  | m.title           |
+---------+-------------------+
| "Grace" | "Compile Error"   |
+---------+-------------------+
1 row
```

**After** (`drilling/code/kata-03-inner-match-drops-unmatched/after/kata.cypher`)

```cypher
// Kata 3 (after): OPTIONAL MATCH keeps every outer row, even with zero DIRECTED edges.
CREATE (:Person {name: 'Ada'});
CREATE (:Person {name: 'Grace'})-[:DIRECTED]->(:Movie {title: 'Compile Error'});

MATCH (p:Person)
// THE FIX: OPTIONAL MATCH never drops the outer row, filling m with NULL instead
OPTIONAL MATCH (p)-[:DIRECTED]->(m:Movie)
RETURN p.name, m.title;
```

<details>
<summary>Model solution</summary>

```cypher
// THE FIX: OPTIONAL MATCH (co-05) preserves every row from the preceding MATCH,
// filling m with NULL wherever the DIRECTED pattern finds nothing.
MATCH (p:Person)
OPTIONAL MATCH (p)-[:DIRECTED]->(m:Movie)
RETURN p.name, m.title;

// => Ada's row now survives, with m.title = NULL
```

**Root cause**: A second plain `MATCH` behaves like Cypher's default inner-join semantics -- it
requires the whole pattern chain, including this new clause, to find a match before any row survives
(Example 27). Ada has zero `DIRECTED` edges, so the second `MATCH` finds nothing for her and her whole
row disappears. `OPTIONAL MATCH` is the clause built specifically to keep the outer row regardless,
filling the optional pattern's variables with `NULL` when nothing matches.

**Run**: `cypher-shell < kata.cypher`

**Output**:

```text
+---------+-------------------+
| p.name  | m.title           |
+---------+-------------------+
| "Ada"   | NULL              |
| "Grace" | "Compile Error"   |
+---------+-------------------+
2 rows
```

</details>

### Kata 4 -- unbounded variable-length path runs unexpectedly wide

**Task.** An interactive "nearby connections" widget is meant to show only Ada's close network,
within 2 hops. The version below leaves the variable-length pattern unbounded, so it returns Ada's
ENTIRE connected chain instead of just her near neighborhood.

**Before** (`drilling/code/kata-04-unbounded-variable-length/before/kata.cypher`)

```cypher
// Kata 4 (before): an unbounded * traverses as far as the graph goes, not just
// the "nearby" 2-hop neighborhood the widget is actually supposed to show.
CREATE (:Person {name: 'Ada'})-[:KNOWS]->(:Person {name: 'Bob'})
      -[:KNOWS]->(:Person {name: 'Cid'})-[:KNOWS]->(:Person {name: 'Dee'})
      -[:KNOWS]->(:Person {name: 'Eve'});
// => a 4-hop chain: Ada -> Bob -> Cid -> Dee -> Eve

// intent: show Ada's NEARBY network, within 2 hops.
MATCH (a:Person {name: 'Ada'})-[:KNOWS*]->(b:Person)
// BUG: unbounded * has no upper limit -- it walks the WHOLE connected chain, not just 2 hops
RETURN b.name
ORDER BY b.name;
```

**Observed (buggy) output**:

```text
+---------+
| b.name  |
+---------+
| "Bob"   |
| "Cid"   |
| "Dee"   |
| "Eve"   |
+---------+
4 rows
```

**After** (`drilling/code/kata-04-unbounded-variable-length/after/kata.cypher`)

```cypher
// Kata 4 (after): *1..2 bounds the traversal to exactly the "nearby" scope intended.
CREATE (:Person {name: 'Ada'})-[:KNOWS]->(:Person {name: 'Bob'})
      -[:KNOWS]->(:Person {name: 'Cid'})-[:KNOWS]->(:Person {name: 'Dee'})
      -[:KNOWS]->(:Person {name: 'Eve'});

// THE FIX: *1..2 bounds the walk to at most 2 hops, matching the widget's real intent.
MATCH (a:Person {name: 'Ada'})-[:KNOWS*1..2]->(b:Person)
RETURN b.name
ORDER BY b.name;
```

<details>
<summary>Model solution</summary>

```cypher
// THE FIX: *1..2 (co-09) bounds the traversal depth inline -- unbounded * risks
// scanning the entire connected component, far past the "nearby" scope intended.
MATCH (a:Person {name: 'Ada'})-[:KNOWS*1..2]->(b:Person)
RETURN b.name
ORDER BY b.name;

// => only Bob (1 hop) and Cid (2 hops) -- Dee and Eve correctly fall outside the bound
```

**Root cause**: `[:KNOWS*]` with no upper bound (Example 14 warns against exactly this) traverses as
many hops as the connected structure actually has, not the number of hops the query author had in
mind -- on this 4-hop fixture it reaches every downstream node, and on a much larger, more densely
connected production graph the same unbounded pattern could touch a very large fraction of the whole
graph. `*1..2` states the intended scope explicitly, so the traversal's cost and result size stay
predictable regardless of how much further the underlying chain actually extends.

**Run**: `cypher-shell < kata.cypher`

**Output**:

```text
+---------+
| b.name  |
+---------+
| "Bob"   |
| "Cid"   |
+---------+
2 rows
```

</details>

### Kata 5 -- missing uniqueness constraint

**Task.** An onboarding script is supposed to guarantee no two `Person` nodes share the same `name`.
The version below never creates the uniqueness constraint, so a duplicate name is silently written
twice instead of being rejected.

**Before** (`drilling/code/kata-05-missing-uniqueness-constraint/before/kata.cypher`)

```cypher
// Kata 5 (before): no CREATE CONSTRAINT was ever run -- nothing stops a duplicate name.
CREATE (:Person {name: 'Ada'});
// => succeeds -- the first (and, if a constraint existed, the ONLY) Person named Ada
CREATE (:Person {name: 'Ada'});
// BUG: a SECOND node with the same name -- nothing rejects it, because no constraint exists

MATCH (p:Person {name: 'Ada'})
RETURN count(p) AS ada_count;
```

**Observed (buggy) output**:

```text
+------------+
| ada_count  |
+------------+
| 2          |
+------------+
1 row
```

**After** (`drilling/code/kata-05-missing-uniqueness-constraint/after/kata.cypher`)

```cypher
// Kata 5 (after): CREATE CONSTRAINT rejects the second write outright.
CREATE CONSTRAINT person_name FOR (p:Person) REQUIRE p.name IS UNIQUE;
// THE FIX: the constraint must exist BEFORE the duplicate write is attempted

CREATE (:Person {name: 'Ada'});
// => succeeds -- first (and now GUARANTEED only) Person named Ada

CREATE (:Person {name: 'Ada'});
// => FAILS: Neo.ClientError.Schema.ConstraintValidationFailed -- rejected before writing
```

<details>
<summary>Model solution</summary>

```cypher
// THE FIX: CREATE CONSTRAINT (co-22) must exist BEFORE the duplicate write is
// attempted -- a constraint created afterward would not retroactively fix data
// that already violates it.
CREATE CONSTRAINT person_name FOR (p:Person) REQUIRE p.name IS UNIQUE;

CREATE (:Person {name: 'Ada'});
CREATE (:Person {name: 'Ada'});
// => the SECOND CREATE fails outright -- zero rows are ever duplicated
```

**Root cause**: Property graphs are schema-optional by default (Example 1) -- nothing stops two nodes
from carrying an identical "unique" value unless a constraint says so explicitly (Example 20). The
buggy script never runs `CREATE CONSTRAINT`, so both `CREATE` calls succeed and the database silently
ends up with two nodes meant to be the one, canonical Ada. Creating the constraint first makes the
second `CREATE` fail loudly and immediately instead.

**Run**: `cypher-shell < kata.cypher`

**Output**:

```text
Neo.ClientError.Schema.ConstraintValidationFailed: Node(1) already exists with label
`Person` and property `name` = 'Ada'
```

</details>

### Kata 6 -- unparameterized Cypher query built via string interpolation

**Task.** `find_person_by_name` should safely look up a `Person` by a caller-supplied name. The
version below builds the `WHERE` clause with an f-string, so a crafted search value injects its own
boolean condition and matches every row instead of none.

**Before** (`drilling/code/kata-06-unparameterized-cypher-injection/before/kata.py`)

```python
# pyright: strict
"""Kata 6 (before): a WHERE clause built via string interpolation -- injectable."""

from neo4j import GraphDatabase, Driver  # => driver package, `pip install neo4j`


def find_person_by_name(driver: Driver, name: str) -> list[str]:
    # THE BUG: f-string interpolation lets the caller's input become CYPHER SYNTAX,
    # not just a value -- the query text itself changes shape based on input.
    query = f"MATCH (p:Person) WHERE p.name = '{name}' RETURN p.name AS name"
    with driver.session() as session:
        result = session.run(query)
        return [row["name"] for row in result]


driver: Driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "password"))
# => a live connection -- swap the URI/credentials for your own setup
with driver.session() as session:
    session.run("CREATE (:Person {name: 'Ada'})")
    session.run("CREATE (:Person {name: 'Grace'})")

# a crafted search value: no person is actually named this, but the OR clause
# it injects makes the WHERE condition true for every row in the database.
malicious_input: str = "nobody' OR '1'='1"
print(find_person_by_name(driver, malicious_input))
driver.close()
```

**Observed (buggy) output** (hand-reasoned from Cypher's documented `WHERE`/`OR` semantics -- this
environment cannot execute a live Neo4j server): the interpolated query text becomes
`MATCH (p:Person) WHERE p.name = 'nobody' OR '1'='1' RETURN p.name AS name`. `'1'='1'` is a valid,
always-true string comparison, and `OR` makes the whole `WHERE` condition true for every row
regardless of `p.name` -- so both seeded people come back, even though no person is named
`"nobody' OR '1'='1"`:

```text
['Ada', 'Grace']
```

**After** (`drilling/code/kata-06-unparameterized-cypher-injection/after/kata.py`)

```python
# pyright: strict
"""Kata 6 (after): a parameterized query neutralizes the same injection attempt."""

from neo4j import GraphDatabase, Driver  # => driver package, `pip install neo4j`


def find_person_by_name(driver: Driver, name: str) -> list[str]:
    # THE FIX: $name is a placeholder, not a splice point -- the driver binds it
    # as a single opaque value, so it can never change the shape of the query.
    query = "MATCH (p:Person) WHERE p.name = $name RETURN p.name AS name"
    with driver.session() as session:
        result = session.run(query, name=name)
        return [row["name"] for row in result]


driver: Driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "password"))
with driver.session() as session:
    session.run("CREATE (:Person {name: 'Ada'})")
    session.run("CREATE (:Person {name: 'Grace'})")

malicious_input: str = "nobody' OR '1'='1"
print(find_person_by_name(driver, malicious_input))
driver.close()
```

<details>
<summary>Model solution</summary>

```python
def find_person_by_name(driver: Driver, name: str) -> list[str]:
    # THE FIX: $name is a bound parameter, not a splice point -- the driver sends
    # it to the engine as an opaque value, never as Cypher syntax.
    query = "MATCH (p:Person) WHERE p.name = $name RETURN p.name AS name"
    with driver.session() as session:
        result = session.run(query, name=name)
        return [row["name"] for row in result]


malicious_input: str = "nobody' OR '1'='1"
print(find_person_by_name(driver, malicious_input))  # => Output: [] (correctly zero matches)
```

**Root cause**: Building `f"... WHERE p.name = '{name}'"` makes the caller's input part of the CYPHER
TEXT ITSELF -- a value crafted with an embedded `' OR '1'='1` does not just fail to match, it adds a
real `OR` clause that makes the whole condition true for every row, the exact hazard the bound
parameters used throughout this course's Python examples (Example 18's `n=n`, Example 44's
`name=name`) are already written to avoid. A `$name` placeholder sends the value to the engine as a
bound parameter, entirely separate from the query text, so no character sequence inside it can ever
be interpreted as Cypher syntax.

**Run**: `python3 kata.py` (against a live Neo4j instance)

**Verify** (hand-reasoned, not a fabricated live-run capture -- this environment cannot execute a live
Neo4j server): with `$name` bound as an opaque parameter, the query becomes
`WHERE p.name = "nobody' OR '1'='1"` as a single literal string comparison -- no person in the fixture
has that literal name, so the query must return the empty list:

```text
[]
```

</details>

### Kata 7 -- supernode fan-out through an unnecessary intermediate node

**Task.** A "find my colleagues" query is meant to return Ada's actual teammates. The version below
matches through the company-wide `AllStaff` group -- a node everyone in the company belongs to -- so
it fans out through the highest-degree node in the whole graph and returns nearly the entire company
instead of Ada's real team.

**Before** (`drilling/code/kata-07-supernode-traversal-fanout/before/kata.cypher`)

```cypher
// Kata 7 (before): matching colleagues through the company-wide AllStaff group
// fans out through the HIGHEST-degree node in the graph, and returns nearly
// everyone instead of just the real team.
CREATE (allstaff:Group {name: 'AllStaff'})
// => the eventual SUPERNODE -- degree grows by 1 for every employee below
WITH allstaff
UNWIND range(1, 18) AS i
CREATE (:Person {name: 'Emp' + toString(i)})-[:MEMBER_OF]->(allstaff)
// => 18 unrelated employees, ALL connected to the SAME AllStaff node
WITH allstaff, count(*) AS _
// => an AGGREGATING WITH -- collapses the 18 UNWIND rows back to 1. A bare `WITH allstaff`
// here would still carry 18 rows, so every write below would fire 18 times, not once.
CREATE (ada:Person {name: 'Ada'})-[:MEMBER_OF]->(allstaff)
CREATE (bob:Person {name: 'Bob'})-[:MEMBER_OF]->(allstaff)
// => Ada and Bob also belong to AllStaff, like everyone else -- AllStaff's degree is now 20
WITH ada, bob
CREATE (team:Group {name: 'GraphTeam'})
CREATE (ada)-[:MEMBER_OF]->(team)
CREATE (bob)-[:MEMBER_OF]->(team);
// => GraphTeam's degree is only 2 -- just Ada and Bob, their REAL shared team

// BUG: matching through AllStaff instead of the specific team fans out through
// the highest-degree node in the whole graph, unnecessarily.
MATCH (a:Person {name: 'Ada'})-[:MEMBER_OF]->(grp:Group {name: 'AllStaff'})<-[:MEMBER_OF]-(colleague:Person)
WHERE colleague <> a
RETURN colleague.name
ORDER BY colleague.name;
```

**Observed (buggy) output** (hand-traced -- 19 rows: Bob plus all 18 unrelated employees, because
`AllStaff` connects everyone in the fixture, sorted as plain strings):

```text
+-----------------+
| colleague.name  |
+-----------------+
| "Bob"           |
| "Emp1"          |
| "Emp10"         |
| "Emp11"         |
| "Emp12"         |
| "Emp13"         |
| "Emp14"         |
| "Emp15"         |
| "Emp16"         |
| "Emp17"         |
| "Emp18"         |
| "Emp2"          |
| "Emp3"          |
| "Emp4"          |
| "Emp5"          |
| "Emp6"          |
| "Emp7"          |
| "Emp8"          |
| "Emp9"          |
+-----------------+
19 rows
```

**After** (`drilling/code/kata-07-supernode-traversal-fanout/after/kata.cypher`)

```cypher
// Kata 7 (after): matching through the SPECIFIC team avoids the supernode entirely.
CREATE (allstaff:Group {name: 'AllStaff'})
WITH allstaff
UNWIND range(1, 18) AS i
CREATE (:Person {name: 'Emp' + toString(i)})-[:MEMBER_OF]->(allstaff)
WITH allstaff, count(*) AS _
// => an AGGREGATING WITH -- collapses the 18 UNWIND rows back to 1, same fix as the "before" form
CREATE (ada:Person {name: 'Ada'})-[:MEMBER_OF]->(allstaff)
CREATE (bob:Person {name: 'Bob'})-[:MEMBER_OF]->(allstaff)
WITH ada, bob
CREATE (team:Group {name: 'GraphTeam'})
CREATE (ada)-[:MEMBER_OF]->(team)
CREATE (bob)-[:MEMBER_OF]->(team);

// THE FIX: match through GraphTeam (degree 2), not AllStaff (degree 20).
MATCH (a:Person {name: 'Ada'})-[:MEMBER_OF]->(grp:Group {name: 'GraphTeam'})<-[:MEMBER_OF]-(colleague:Person)
WHERE colleague <> a
RETURN colleague.name;
```

<details>
<summary>Model solution</summary>

```cypher
// THE FIX: match through GraphTeam (co-17, co-11) instead of AllStaff -- GraphTeam
// carries degree 2 in this fixture, AllStaff carries degree 20, so this pattern
// touches ten times FEWER relationships on this small fixture alone, and the gap
// only widens as the company grows while GraphTeam's own size stays fixed.
MATCH (a:Person {name: 'Ada'})-[:MEMBER_OF]->(grp:Group {name: 'GraphTeam'})<-[:MEMBER_OF]-(colleague:Person)
WHERE colleague <> a
RETURN colleague.name;

// => "Bob" -- correctly scoped to Ada's REAL team, not the entire company
```

**Root cause**: `AllStaff` is a supernode by construction -- every employee belongs to it, so its
degree grows 1-to-1 with headcount, exactly the shape Example 43 identifies by degree count (co-17).
Matching colleagues through it forces the query to enumerate all 20 of `AllStaff`'s relationships to
find every other member (co-04's index-free adjacency still applies, but the STARTING node's own
degree is what the cost tracks), and returns nearly the whole company as "colleagues" in the process
-- a correctness bug and a performance bug from the same root cause. `GraphTeam`, with degree 2 in
this fixture, is both the narrower, semantically correct group to match through AND the cheaper one
to traverse -- the same property-to-node promotion pattern Example 72 uses to mitigate a real
supernode.

**Run**: `cypher-shell < kata.cypher`

**Output**:

```text
+-----------------+
| colleague.name  |
+-----------------+
| "Bob"           |
+-----------------+
1 row
```

</details>

## Self-check checklist

Confirm each item without checking the manual first. If you hesitate, that concept needs another
pass.

- [ ] I can explain what a property graph is built from and write the smallest possible node-only
      fact. (co-01)
- [ ] I can explain how RDF's triple model differs from a labeled-property graph's node-bundling.
      (co-02)
- [ ] I can name the specific shape of question where a graph traversal beats a relational join
      chain. (co-03)
- [ ] I can explain index-free adjacency and what it does and does not guarantee about traversal
      cost. (co-04)
- [ ] I can write a `MATCH`/`WHERE`/`RETURN` read pipeline. (co-05)
- [ ] I can write both a `CREATE` and an idempotent `MERGE` with `ON CREATE`/`ON MATCH` branches.
      (co-06)
- [ ] I can write a directed, typed relationship pattern and explain why an undirected match returns
      more rows. (co-07)
- [ ] I can explain what it means for Cypher's pattern matching to be declarative. (co-08)
- [ ] I can write both the classic `*1..3` and the modern quantified-relationship variable-length
      syntax, and explain why bounding one matters. (co-09)
- [ ] I can explain the difference between a hop-counting and a weighted shortest path, and name the
      function/procedure for each. (co-10)
- [ ] I can decide whether a fact belongs as a node, a property, or a relationship, and name the
      trigger for promoting a property to a node. (co-11)
- [ ] I can model a many-to-many fact as a relationship instead of a join table, with a property on
      the relationship itself. (co-12)
- [ ] I can walk a hierarchy both upward and downward using the same relationship type. (co-13)
- [ ] I can write a bill-of-materials traversal and explain what a recursive SQL CTE would need
      instead. (co-14)
- [ ] I can write a co-occurrence recommendation query, including its exclusion filter. (co-15)
- [ ] I can name two structural fraud-detection patterns and the query shape that surfaces each.
      (co-16)
- [ ] I can identify a supernode by degree and explain why index-free adjacency does not protect
      against its cost. (co-17)
- [ ] I can explain why sharding a connected graph inherently cuts relationships, unlike sharding
      independent rows. (co-18)
- [ ] I can explain Neo4j's ACID transaction guarantee, including what a concurrent write conflict
      does. (co-19)
- [ ] I can name the two bulk-loading paths and when each is the right choice. (co-20)
- [ ] I can pin a query to Cypher 5 or Cypher 25 explicitly and explain why the pin matters. (co-21)
- [ ] I can create a uniqueness constraint and a property index, and explain the difference between
      them. (co-22)
- [ ] I can chain `WITH`, `UNWIND`, an aggregate function, and `ORDER BY`/`LIMIT`/`SKIP` in one
      query. (co-23)
- [ ] I can write a basic SPARQL `SELECT ... WHERE` query and explain how it resembles Cypher's
      `MATCH`. (co-24)
- [ ] I can write a Gremlin traversal using `addV`/`addE`/`has`/`out`, and explain why it is
      imperative rather than declarative. (co-25)
- [ ] I can project an in-memory GDS graph and explain why algorithms run against a projection rather
      than the live graph. (co-26)
- [ ] I can explain, in one sentence, why a graph database's central performance win is about
      deep-traversal latency, not raw storage throughput -- and why the domain this course models
      genuinely IS connectedness itself, not an incidental property of otherwise independent rows.
      (`consistency-latency-throughput` / `coupling-vs-cohesion`)

## Elaborative interrogation & self-explanation

Six why/why-not prompts. Answer each in your own words before opening the model explanation.

**E1.** Why does index-free adjacency make a graph traversal's cost track the STARTING node's own
degree rather than the total size of the database -- and why does that guarantee stop protecting you
the moment one node's own degree becomes unusually large? Tie your answer to
`consistency-latency-throughput`.

<details>
<summary>Model explanation</summary>

Index-free adjacency means each node stores direct pointers to its own relationships, so a hop's cost
is a lookup local to that one node's own adjacency list, never a search across the whole database
(Example 18). That is exactly the "deep-traversal performance is the specific win a graph database is
built around" framing `consistency-latency-throughput` names for this course: latency for a k-hop
query tracks the actual path walked, not the total stored volume. But the guarantee is scoped to
"proportional to the node's OWN degree" -- it says nothing about how large that degree happens to be.
A supernode with 50,000 relationships genuinely has 50,000 relationships to enumerate on a hop through
it (Example 44); index-free adjacency's promise is about locality, not about a bound on any one
node's own size, which is exactly why co-17's mitigation (Example 72) exists as a separate, deliberate
structural fix rather than something index-free adjacency solves automatically.

</details>

**E2.** Why does modeling a many-to-many fact as a relationship, rather than a join table, count as an
example of `coupling-vs-cohesion` specifically, rather than just "less Cypher to write"?

<details>
<summary>Model explanation</summary>

`coupling-vs-cohesion` in this course names something deeper than syntax convenience: the domain a
graph database models genuinely IS connectedness itself, not an incidental property of otherwise
independent rows. A relational join table treats "Ada takes Graph Theory" as an accident of two
independent entity tables needing to reference each other; a `TAKES` relationship treats the same fact
as what it structurally is -- a first-class connection with its own identity and its own properties
(Example 33, Example 34). The cohesion argument is that the relationship's shape in the model matches
the relationship's shape in the real world directly, rather than being reconstructed at query time via
a join that has to rediscover a connection the schema itself does not represent as one.

</details>

**E3.** Why does `MERGE` need separate `ON CREATE`/`ON MATCH` branches instead of one unconditional
write, the way `CREATE` gets away with?

<details>
<summary>Model explanation</summary>

`MERGE` is fundamentally ambiguous about which of two very different things just happened -- did this
statement just create brand-new data, or did it find data that was already there? Those two outcomes
often need genuinely different follow-up actions: a first-seen timestamp only makes sense to set once,
on creation, while a running "seen" counter only makes sense to increment on a repeat match (Example
11). A single unconditional `SET` after `MERGE` cannot express that distinction at all -- it would
either stamp `firstSeen` on every rerun (wrong) or never increment `seen` (also wrong).
`ON CREATE`/`ON MATCH` exist specifically because `MERGE`'s two branches are semantically different
operations that happen to share the same match-or-create entry point.

</details>

**E4.** Why do a property graph and an RDF triple store model the identical set of facts so
differently, and why isn't one simply "more correct" than the other?

<details>
<summary>Model explanation</summary>

A property graph bundles a resource's facts into one addressable node object -- a label plus a bag of
properties -- which is compact and ergonomic for pattern-matching within a single, self-contained
database (Example 1, Example 64). RDF instead decomposes literally everything, including what a
property graph calls a "property," into its own subject-predicate-object triple, with no single node
object bundling a resource's facts together (Example 25, Example 78). Neither is more correct because
they optimize for different things: RDF's uniform triple shape is what makes merging datasets from
entirely different sources under a shared, standardized vocabulary straightforward (co-02), while the
property graph's bundling trades that uniformity for more compact, more ergonomic pattern-matching
within one database that was never meant to merge with an external, unrelated dataset at the triple
level.

</details>

**E5.** Why does sharding a densely connected graph inherently cut relationships, when sharding a
table of independent customer rows by ID never needs a cross-shard join at all?

<details>
<summary>Model explanation</summary>

Independent rows, by definition, do not reference each other -- a customer row sharded by ID has no
structural need to ever look at another shard, because nothing about that row's meaning depends on a
different customer's row. A graph's entire reason for existing is the opposite: relationships are the
actual data (`coupling-vs-cohesion` again), so any partition boundary drawn across a densely connected
graph is very likely to slice through real relationships that were meaningfully connecting two
now-separated pieces (Example 45). Every one of those cut relationships becomes a network round trip
at query time instead of a local pointer follow -- which is exactly why community-aware sharding
(Example 73) is worth the extra work: it draws the boundary along the graph's own naturally sparse
seams instead of an arbitrary id range.

</details>

**E6.** Why does Neo4j ship two parallel Cypher dialects (Cypher 5 and Cypher 25) side by side, rather
than just evolving Cypher's syntax in place the way most languages version their standard library?

<details>
<summary>Model explanation</summary>

Evolving Cypher's syntax in place would mean every existing query, application, and script written
against the old syntax could silently start behaving differently -- or fail outright -- the moment the
database engine itself upgraded, with no way to opt out. Freezing Cypher 5 (bug-fixes only) alongside
an evolving Cypher 25 (Example 15, Example 79) lets existing code keep behaving identically
indefinitely, while new code deliberately opts into the evolving, GQL-aligned dialect via the
`CYPHER 25` prefix or a new database's own default (Example 52, Example 53). The cost is that two
dialects now coexist, and any course or reference material touching version-sensitive syntax has to
say explicitly which one it targets, rather than assuming one unversioned "Cypher" the way older
material could. (Cypher 5/Cypher 25 are the current dialect names at the time this course was
written -- see the course overview's dated [References](../overview.md#references).)

</details>

---

← Previous: [Capstone](../learning/capstone/overview.md)
