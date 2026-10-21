---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

Drilling turns worked examples into durable skill: recall the concepts cold, apply them to new situations, repair broken starting points, check yourself honestly, and argue the design choices against their rejected alternatives. Work this page after the capstone, with a terminal open. Kencana Parts Co. and every company below are fictional.

Work each section in order and do not skip ahead. Read a recall question, answer aloud before opening its details block, and mark any hesitation as a re-read flag for the matching theme. Solve applied problems on paper or in a scratch file before reading their expected lines; the expected text confirms direction, not digits, so a different route to the same verdict still counts. Run every kata starter, watch it print the wrong answer, then fix it before comparing with the solution: the repair motion is the skill, not the final file. Score the checklist honestly at the end, and revisit any unchecked line in its theme before calling the course done.

## Recall Q&A

### Q1 (co-01): What is a datom, and what are its four positions?

<details>
<summary>Model answer</summary>

A datom is one immutable fact: entity, attribute, value, and transaction. Entity 1 carries part/name Road wheel 700c by transaction 1001 in Example 1, and that tuple shape never varies. The positions matter because every query, index, and as-of filter reaches into the same four slots. Any store that calls itself fact-shaped must show you these four parts for every fact it keeps.

</details>

Going deeper: draw one datom as four labeled boxes, then point at each box in a real query and name the position it constrains.

### Q2 (co-01): Why can two datoms about the same attribute both survive?

<details>
<summary>Model answer</summary>

Because the log appends instead of overwriting: the wheel at 180 in March and at 175 in April are two coexisting facts in Example 5. A reader asking for the present takes the newest; a reader asking about March takes the older one. Survival of old facts is what makes history queries possible at all.

</details>

Going deeper: assert a third price in a scratch file and re-derive which read each of the three queries returns.

### Q3 (co-02): What is an entity, and where do its attributes live?

<details>
<summary>Model answer</summary>

An entity is an identity, a bare id like 1 or 20, and its attributes live in the datoms that reference it, as Example 2 shows with four facts sharing entity 1. Nothing else binds them: no row container, no document envelope. Lose the id and the facts scatter; keep it and the record reassembles on demand.

</details>

Going deeper: rename one entity in two transactions, then show that tempid-era facts and current facts share nothing but the id.

### Q4 (co-03): What does an attribute declaration promise?

<details>
<summary>Model answer</summary>

A name, a value type, and a cardinality, installed before any datom uses the slot, as in Example 6 with part/name, part/price, and part/tags. Writers get their values checked at transact time and readers know how many values to expect. The schema is small data with large consequences for every query downstream.

</details>

Going deeper: declare a fourth attribute with a wrong type on purpose, watch the gate refuse it, then fix the declaration.

### Q5 (co-04): What makes a transaction atomic, and why does it matter?

<details>
<summary>Model answer</summary>

A transaction installs all of its datoms or none, validated before anything lands, as Example 11 proves with a good batch of three and a refused batch of zero. Partial writes never reach the log. Atomicity is what lets an order and its line items stay inseparable even when validation fails halfway through.

</details>

Going deeper: mix one bad datom into a good batch and prove the log gains nothing, not even the good ones.

### Q6 (co-04): How do conditional writes prevent lost updates?

<details>
<summary>Model answer</summary>

A write carries a precondition on the current value, and only a matching store state installs it, as Example 15 shows with Rani accepted and Bimo rejected. Check and install share one transaction so no interleaving slips between them. The loser retries with fresh eyes instead of overwriting blindly.

</details>

Going deeper: run two swaps against the same seen value and confirm exactly one acceptance, then swap the arrival order.

### Q7 (co-05): What does a retraction do to the past?

<details>
<summary>Model answer</summary>

Nothing: it ends a fact's present by naming it with a closing transaction while the original datom stays put, as Example 12 shows with red gone now but present in history. Readers of the present skip it; readers of the past still see it. Retraction is how something stops being true without pretending it never was.

</details>

Going deeper: retract one of two color facts and show the survivor still reads while the retracted one needs its era.

### Q8 (co-06): How does an as-of query pick its answer?

<details>
<summary>Model answer</summary>

It keeps only datoms from transactions at or before the target and takes the newest survivor, as Example 28 does for the March and April prices. The present is just as-of now, so one code path serves both. Any past transaction is a queryable database, which is the whole point of keeping the log.

</details>

Going deeper: query as of a transaction before anything existed and confirm the honest empty answer.

### Q9 (co-06): What is the difference between as-of and history?

<details>
<summary>Model answer</summary>

As-of answers one moment while history replays every era, as Examples 28 and 29 show side by side: 180 for March versus the full opened-closed timeline. Both read the same log with different filters. Audits re-derive single moments; timelines explain how the present came to be.

</details>

Going deeper: pick one era from Example 29 and defend its open and close stamps to a skeptical reviewer.

### Q10 (co-07): What is a Datalog clause, and what does a query return?

<details>
<summary>Model answer</summary>

A clause is a pattern over the fact set with variables for the unknown parts, and a query returns the bindings that satisfy all of its clauses, as Example 16 shows with one clause and three entities. Patterns describe; the engine searches. Projection then narrows the bindings to the promised output columns.

</details>

Going deeper: add a fourth clause to Example 16 and predict the binding count before running it.

### Q11 (co-07): When do you need an explicit universe for negation?

<details>
<summary>Model answer</summary>

Always: not means set difference against a bounded starting set, because the database cannot list everything it never said, as Example 21 shows with named parts minus colored parts. State the universe first. Unbounded negation is not a query but a riddle.

</details>

Going deeper: remove the universe bound from Example 21 and explain precisely why the question stops making sense.

### Q12 (co-08): What does repeating a variable across clauses do?

<details>
<summary>Model answer</summary>

It constrains every occurrence to the same value, which is unification, and shared variables are what make joins work, as Example 22 shows with ?c binding customer 20 in both clauses. A variable renamed in one clause but not the other silently turns a join into a cross product. Name shared variables after the thing they are.

</details>

Going deeper: rename ?c differently in each clause and observe the cross product, then repair it.

### Q13 (co-09): What is a rule, and when should a repeated pattern become one?

<details>
<summary>Model answer</summary>

A rule names a clause pattern so every query can reuse it, like discount_eligible in Example 24 serving both the quote screen and the report. Centralize the third time you copy a condition. Copies agree until the policy changes; the rule agrees afterwards too.

</details>

Going deeper: change the threshold to 600 and confirm both callers move without touching either query.

### Q14 (co-09): How does a recursive rule terminate?

<details>
<summary>Model answer</summary>

Each call moves strictly downward through an acyclic graph until no children remain, as Example 26 shows walking the assembly tree to its four leaves. State what shrinks on every call. Cycles would loop forever, so prove acyclicity before trusting the fixpoint.

</details>

Going deeper: add a cycle to the contains graph in a scratch copy and observe the non-termination, then remove it.

### Q15 (co-10): What is an index in this model, and what does EAVT order give you?

<details>
<summary>Model answer</summary>

An index is one sorted order over the same datoms, and EAVT groups every entity's facts into one contiguous run, as Example 34 shows with entity 1 first. Different questions want different orders: AEVT for attribute reports, AVET for ranges. Sorting is the whole index, no trees required at this scale.

</details>

Going deeper: add a seventh datom and predict its EAVT neighbors before sorting.

### Q16 (co-10): Who pays for an index, and when?

<details>
<summary>Model answer</summary>

Writes do: every new datom is filed into each ordering at transact time, as Example 37 shows with four runs of length one. Reads borrow against that payment. Count your read-write ratio before adding an ordering, and drop any index whose questions nobody asks.

</details>

Going deeper: drop one index and name the exact question family that gets slower.

### Q17 (co-11): How do cardinality one and cardinality many differ in reads?

<details>
<summary>Model answer</summary>

Cardinality one has one current value with history behind it, while cardinality many has a set with no single current value, as Examples 8 and 9 show with names versus tags. Ask cardinality-one slots for the latest and cardinality-many slots for membership. Mixing them up reads nonsense confidently.

</details>

Going deeper: convert one cardinality-one slot to many in a scratch schema and list every query that changes meaning.

### Q18 (co-12): What lives in the value position of a reference attribute?

<details>
<summary>Model answer</summary>

An entity id, not a literal, as Example 40 shows with order 10 pointing at customer 20. That single convention turns flat facts into a traversable graph. Follow the id to resolve it, chain resolutions to traverse, and declare ownership so deletes cascade precisely.

</details>

Going deeper: reverse one reference and show which traversals break and which survive.

### Q19 (co-12): What is the difference between a component and a shared reference?

<details>
<summary>Model answer</summary>

Components die with their parent while shared references survive any single user of them, as Example 42 shows with two deleted lines and one surviving customer. Ownership is a schema decision, not a query decision. Mark each attribute owned or shared at creation and deletes become boring.

</details>

Going deeper: compute the storage ratio for an attribute repriced daily for a year.

### Q20 (co-13): Why does an append-only log store more than a row store?

<details>
<summary>Model answer</summary>

Because every change adds a datom while a cell overwrites, as Example 44 shows with ten prices versus one cell. History is stored, never reconstructed. The ratio is the honest price of total recall: worth it where the past is questioned, wasteful where it never is.

</details>

Going deeper: start a snapshot, land five writes, and prove the report count never flickers.

### Q21 (co-14): Why do snapshot readers never block writers?

<details>
<summary>Model answer</summary>

Because the past never changes, a reader holding a transaction id needs no lock, as Example 45 shows with a stable count of five and zero lock waits. Snapshots isolate readers by construction. Reports pin a transaction while the warehouse keeps transacting around them.

</details>

Going deeper: add a second new attribute and show old, middle, and new readers each seeing their own era.

### Q22 (co-15): How does schema evolution avoid migrations?

<details>
<summary>Model answer</summary>

By addition: new attributes start collecting facts from their install transaction while old datoms stand untouched, as Example 10 shows with origin tracking arriving mid-year. Old readers never notice. Declare the slot, write to it, and skip the flag day entirely.

</details>

Going deeper: score your own current project on the four features and write down the verdict.

### Q23 (co-16): Name the four workload features and the threshold

<details>
<summary>Model answer</summary>

Audit need, history reads, write calm, and relationships, each scored 0 to 10, recommending facts at 24 or above, as Example 48 shows with Kencana scoring 32. Counters fail the calm test; catalogs pass everything. Run every new workload through the four before choosing a store.

</details>

Going deeper: list one workload from your work that fails the calm test and sketch its rollup plan.

### Q24 (co-16): When should you NOT use this model?

<details>
<summary>Model answer</summary>

When writes churn by the thousand with no historical questions, like the page-view counter in Example 46, or when bulk aggregation over billions of rows dominates. Counters belong in specialized stores with rollups as facts. The model serves the workload, never the reverse.

</details>

Going deeper: argue the opposite verdict for Kencana and find the strongest honest objection to facts.

## Applied problems

### P1: Reprice and re-audit the wheel

Change the wheel price to 190 in a new transaction, then write the as-of query that proves March still reads 180. Expected: two price datoms coexist; as-of 30101 returns 180 and the newest read returns 190.

Approach: open a scratch file, write the repricing transact with a fresh id, then query as-of 30101 and the newest read. What good looks like: two price datoms, March pinned at 180, and a one-line explanation of which filter picks each answer.

Common mistake: reading the newest price for both eras, which prints 190 twice and fails the audit.

### P2: Tag the sale shelf

Add a sale tag to every part priced below 100, then list the sale set with one membership clause. Expected: the cog and the basket match; the wheel and the motor do not.

Approach: assert one sale tag per cheap part in a single transaction, then run the membership clause for the sale tag. What good looks like: exactly the cog and the basket, with the query naming the tag once and the data once.

Common mistake: filtering by name substring instead of the tag set, which misses tag-only matches.

### P3: Kill the second phone

Retract the 022-222 phone fact, then show old readers one number and the history both. Expected: current phones read [022-111] while the log still holds two phone datoms plus one retraction.

Approach: record the retraction at its own transaction, then read current phones and the full phone history. What good looks like: one current number, two historical datoms plus one retraction, and no confusion between the two readings.

Common mistake: deleting the datom instead of retracting, which empties the history as well as the present.

### P4: Ship only Bandung bundles

Write the two-hop rule that lists orders whose customer lives in Bandung, over three new orders. Expected: only Bandung-customer orders print; Surabaya orders are excluded by the city clause.

Approach: add three orders with mixed customer cities, then chain order to customer to city in one query. What good looks like: only Bandung orders print, each with its two-hop evidence attached.

Common mistake: joining on names instead of entity ids, which breaks the moment two customers share a name.

### P5: Index the price reports

Build the AVET run over six prices and slice the 100 to 200 band. Expected: the slice holds exactly the in-band prices in value order, and nothing outside the band is touched.

Approach: assert six prices, sort the AVET run, then slice it to the band edges. What good looks like: the slice holds exactly the in-band prices in value order, and a count of untouched facts outside the band.

Common mistake: scanning the whole run and filtering, which answers correctly but never touches the index.

### P6: Promote with rules, not copies

Extract the free-shipping check into a named rule used by two queries, then change the threshold once. Expected: both queries move together with one edit; no copy is left behind.

Approach: name the rule once, call it from both queries, then move the threshold and rerun. What good looks like: both answers move together with one edit, and a grep that finds exactly one threshold in the codebase.

Common mistake: editing the threshold in one query and forgetting the other, which reintroduces the drift.

### P7: Audit a disputed invoice

Total order 10 with March prices and with current prices, and show the two numbers side by side. Expected: 485 then, 475 now, with the join identical and only the as-of target moved.

Approach: total order 10 twice with different as-of targets, keeping the join text identical. What good looks like: 485 then, 475 now, and a sentence explaining which price moved and when.

Common mistake: copying March prices into the invoice, which freezes numbers the log could reproduce exactly.

### P8: Score a click counter

Run the four-feature checklist against a page-view counter workload. Expected: low calm score drags the total under 24 with a use-rows verdict and a rollup plan.

Approach: score audit need, history reads, write calm, and relationships honestly for the counter. What good looks like: a total under 24, a use-rows verdict, and a rollup plan that keeps the dashboards fast.

Common mistake: scoring calm from today's volume and ignoring the holiday spike that arrives every December.

## Code katas

Each kata lives under `drilling/code/kata-NN-<slug>/` with a `before/kata.py` starter, an `after/kata.py` solution, and a `run.yaml` that runs the solution. Work the starter first with the lesson examples closed, then compare against the solution and re-run to verify. The repair motion is the skill: a kata only counts when you have watched the starter print the wrong answer, fixed it yourself, and seen the harness agree.

- Kata 01, Retract, Then Query Before and After. **`drilling/code/kata-01-add-retraction-and-query-before-after/after/kata.py`**: add the 70102 retraction, then read the color now (empty) and as of 70101 (red). The starter prints the color for now; the fix empties it while the past stays red.

- Kata 02, Join Orders to Parts to Names. **`drilling/code/kata-02-datalog-join-across-three-entities/after/kata.py`**: build the entity-to-name map and pair each order with its joined part name. The starter prints empty rows; the fix lists both orders with their names.

- Kata 03, Index Entity 2, Then Prove the Seek. **`drilling/code/kata-03-add-index-and-show-query-it-speeds-up/after/kata.py`**: sort the datoms into EAVT order and count the seek against the scan. The starter prints a seek cost of 4; the fix counts entity 2's two-datom block.

- Kata 04, Audit the Price as of Friday. **`drilling/code/kata-04-as-of-audit-for-price-change/after/kata.py`**: write the as-of read so Friday shows 180 and today shows 175. The starter prints None twice; the fix filters by target and takes the newest.

- Kata 05, Extract the Discount Rule. **`drilling/code/kata-05-rule-for-discount-eligibility/after/kata.py`**: fill the eligible rule so the quote screen and the report agree. The starter prints two empty lists; the fix prints both screens with orders 10 and 12.

### Kata 01 solution: Retract, Then Query Before and After

**After** (`drilling/code/kata-01-add-retraction-and-query-before-after/after/kata.py`)

```python
# Kata 01 solution: retract a color, then read it now and as of before.
# => Kencana Parts Co. is fictional; every number here is fixed.
# => The retraction ends the present; the past stays readable.
db = [(1, "part/color", "red", 70101)]  # => the original color fact
# => Red is discontinued at transaction 70102.
retracted_at = 70102  # => visibility ends here
# => Now is empty because the retraction landed.
now = [] if retracted_at == 70102 else ["red"]  # => the present reading
# => As of 70101 the retraction had not happened yet.
then = [v for _e, _a, v, t in db if t <= 70101]  # => the past reading
# => Print both readings.
print("now:", now)  # => Output is empty
# => The check the lesson quotes.
print("then:", then)  # => Output shows red
```

**Output** (`drilling/code/kata-01-add-retraction-and-query-before-after/expected/main.stdout.txt`):

```text
now: []
then: ['red']
```

Starter behaviour: now prints the color and then prints red, because no retraction exists. Repair: set retracted_at to 70102 so the present reading empties while the as-of reading stays red. Lesson: one stored transaction separates the two tenses.

Concepts exercised: retraction and as-of reads, and the visibility window between them.

### Kata 02 solution: Join Orders to Parts to Names

**After** (`drilling/code/kata-02-datalog-join-across-three-entities/after/kata.py`)

```python
# Kata 02 solution: join orders to parts to names across three entities.
# => Kencana Parts Co. is fictional; every number here is fixed.
# => The shared part entity is the whole join.
db = [  # => two orders, two parts
    # => Entity 10 order/part.
    (10, "order/part", 1, 70201),  # => order 10 wants entity 1
    # => Entity 11 order/part.
    (11, "order/part", 2, 70201),  # => order 11 wants entity 2
    # => Entity 1 part/name.
    (1, "part/name", "Road wheel 700c", 70201),  # => entity 1
    # => Entity 2 part/name.
    (2, "part/name", "Track cog 16t", 70201),  # => entity 2
    # => Close the collection.
]  # => four facts, two joins to compute
# => Map each part entity to its name.
names = {e: v for e, a, v, _t in db if a == "part/name"}  # => entity to name
# => Pair each order with its joined part name.
rows = [(o, names[p]) for o, a, p, _t in db if a == "order/part"]  # => the join
# => Print one joined row per order.
print("rows:", sorted(rows))  # => Output lists both orders with names
```

**Output** (`drilling/code/kata-02-datalog-join-across-three-entities/expected/main.stdout.txt`):

```text
rows: [(10, 'Road wheel 700c'), (11, 'Track cog 16t')]
```

Starter behaviour: rows prints empty because the names map is empty. Repair: build names from part/name datoms, then pair each order with names[p]. Lesson: the join key must be resolved before it can be followed.

Concepts exercised: shared variables across three entities, and projection of the joined answer.

### Kata 03 solution: Index Entity 2, Then Prove the Seek

**After** (`drilling/code/kata-03-add-index-and-show-query-it-speeds-up/after/kata.py`)

```python
# Kata 03 solution: build an EAVT run and count the seek against the scan.
# => Kencana Parts Co. is fictional; every number here is fixed.
# => The sorted run turns the search into a block read.
db = [  # => two entities, two facts each
    # => Entity 1 part/name.
    (1, "part/name", "Road wheel 700c", 70301),  # => entity 1
    # => Entity 1 part/price.
    (1, "part/price", 180, 70301),  # => entity 1
    # => Entity 2 part/name.
    (2, "part/name", "Track cog 16t", 70301),  # => entity 2
    # => Entity 2 part/price.
    (2, "part/price", 25, 70301),  # => entity 2
    # => Close the collection.
]  # => four facts, one target entity
# => Sort the datoms into EAVT order.
eavt = sorted(db)  # => entity 1's block, then entity 2's
# => The scan touches everything; the seek reads the block.
scan_cost = len(db)  # => four comparisons
# => Entity 2 owns two of the four datoms in the sorted run.
seek_cost = sum(1 for d in eavt if d[0] == 2)  # => the block size
# => Print both costs.
print("scan-cost:", scan_cost)  # => Output shows 4
# => The check the lesson quotes.
print("seek-cost:", seek_cost)  # => Output shows 2
```

**Output** (`drilling/code/kata-03-add-index-and-show-query-it-speeds-up/expected/main.stdout.txt`):

```text
scan-cost: 4
seek-cost: 2
```

Starter behaviour: both costs print 4 because no index exists. Repair: sort into eavt, then count entity 2's block. Lesson: the seek cost is the block size, and the block only exists after sorting.

Concepts exercised: sorted runs, block reads, and counted seek costs against full scans.

### Kata 04 solution: Audit the Price as of Friday

**After** (`drilling/code/kata-04-as-of-audit-for-price-change/after/kata.py`)

```python
# Kata 04 solution: read the price as of a past transaction for the audit.
# => Kencana Parts Co. is fictional; every number here is fixed.
# => The newest datom at or before the target wins.
db = [  # => two prices, two transactions
    # => Entity 1 part/price.
    (1, "part/price", 180, 70401),  # => Friday's price
    # => Entity 1 part/price.
    (1, "part/price", 175, 70402),  # => today's price
    # => Close the collection.
]  # => the audit spans both


# => Return the newest price at or before the target.
def as_of(target):  # => the time-travel read
    # => Candidates predate the target; the newest wins.
    return max((t, v) for _e, _a, v, t in db if t <= target)[1]  # => the era's price


# => Print Friday, then today.
print("friday-price:", as_of(70401))  # => Output shows 180
# => The check the lesson quotes.
print("today-price:", as_of(70402))  # => Output shows 175
```

**Output** (`drilling/code/kata-04-as-of-audit-for-price-change/expected/main.stdout.txt`):

```text
friday-price: 180
today-price: 175
```

Starter behaviour: both prints show None because as_of is a stub. Repair: filter by t <= target and take the newest. Lesson: time travel is one comparison plus a maximum.

Concepts exercised: newest-at-or-before filtering, and watermarks as audit pins.

### Kata 05 solution: Extract the Discount Rule

**After** (`drilling/code/kata-05-rule-for-discount-eligibility/after/kata.py`)

```python
# Kata 05 solution: extract the discount check into one named rule.
# => Kencana Parts Co. is fictional; every number here is fixed.
# => One rule, two callers, zero drift.
orders = {10: 640, 11: 120, 12: 515}  # => order totals in whole units


# => An order is eligible when its total tops 500.
def eligible(order):  # => the single definition
    # => Above 500 earns the discount.
    return orders[order] > 500  # => the real rule


# => Both screens call the same rule.
quote = sorted(o for o in orders if eligible(o))  # => the quoting screen
# => Compute the next value.
report = sorted(o for o in orders if eligible(o))  # => the month-end report
# => Print both answers.
print("quote:", quote)  # => Output shows 10 and 12
# => The check the lesson quotes.
print("report:", report)  # => Output shows 10 and 12
```

**Output** (`drilling/code/kata-05-rule-for-discount-eligibility/expected/main.stdout.txt`):

```text
quote: [10, 12]
report: [10, 12]
```

Starter behaviour: both screens print empty because the rule refuses everything. Repair: return orders[order] > 500. Lesson: the policy lives in one function, and both callers inherit the fix.

Concepts exercised: named rules, single definitions, and drift-free callers.

## Self-check checklist

1. Explain the four datom positions for any fact on sight (co-01).
2. Describe an entity as the set of datoms sharing its id (co-02).
3. Declare an attribute with type and cardinality before using it (co-03).
4. Group multi-fact writes into one validated atomic transaction (co-04).
5. Retract a fact and show both its empty present and its past (co-05).
6. Read any attribute as of any past transaction (co-06).
7. Write a two-clause join and a filtered, projected query (co-07).
8. Trace a shared variable through a three-entity join (co-08).
9. Extract a repeated pattern into a named, tested rule (co-09).
10. Sort one fact set into EAVT, AEVT, and AVET runs (co-10).
11. Choose cardinality one versus many for a new attribute (co-11).
12. Model a relationship as a reference and traverse two hops (co-12).
13. Argue the storage cost of one hot attribute from its history (co-13).
14. Explain why snapshot readers take no locks (co-14).
15. Add an attribute to a live schema without migrating (co-15).
16. Score a workload on the four features and defend the verdict (co-16).
17. Convert a SQL join condition into shared Datalog variables.
18. Bound every negation with an explicit universe.
19. Chain two rules and test each layer alone.
20. Write a recursive rule with a stated termination argument.
21. Slice a range query from a value-ordered run.
22. Join a fact timeline to its signed transaction log.
23. Deduplicate a union and verify each branch separately.
24. Reproduce a historical invoice without copied prices.

## Elaborative interrogation & self-explanation

### Why datoms instead of rows with history tables?

History tables duplicate the schema and drift from it, while datoms make every write historical by construction. Rejected alternative: triggers copying rows to shadow tables, which doubles every migration and still cannot answer as-of joins. The log wins because the past is the same shape as the present.

### Why Datalog instead of SQL for these queries?

Shared variables express joins, recursion, and rules in one uniform clause shape that stays small as paths grow. Rejected alternative: recursive CTEs plus application code, which splits one question across two languages and two failure modes. SQL still wins for bulk aggregation; Datalog wins for graph-shaped questions.

### Why retract instead of delete?

Deletes destroy evidence while retractions preserve it with an explicit end, so audits, old quotes, and history pages keep working. Rejected alternative: a deleted flag column, which every query must remember to filter and every new developer forgets once. Retraction wins because visibility becomes data instead of discipline.

### Why four indexes instead of one?

Each common question family deserves its own contiguous run: entities, attributes, values, and their combinations. Rejected alternative: one primary order plus full scans, which is fine at hundreds of datoms and hopeless at millions. Four indexes win where reads outnumber writes a hundred to one; otherwise they are vanity.

### Why no real Datomic server in this course?

A licensed server would add procurement, network, and version questions to every example without changing a single concept. Rejected alternative: running the real product, which teaches operations instead of the model. The reference engine wins because every example runs offline, deterministically, on the standard library alone.

### Why score the workload instead of choosing by instinct?

Instinct remembers the last success and forgets the last outage, while four scored features force all four trade-offs into the open. Rejected alternative: adopting the model everywhere, which stores click counters as a thousand near-identical datoms. The checklist wins because it says no with reasons, not taste.

## Concept-to-theme index

When a checklist item wobbles, this index names the theme and the worked examples to re-read.

- **co-01** (Theme A): Examples 1, 2, 4, 5 show the datom shape, shared identity, anatomy, and append-only growth.
- **co-02** (Theme A): Examples 1, 2, 3 separate identity from attributes and settle it through tempids.
- **co-03** (Theme B): Examples 6 and 7 declare slots and enforce types at write time.
- **co-04** (Theme C): Examples 11, 14, and 15 batch atomically, sign work, and guard races.
- **co-05** (Theme C): Examples 12 and 13 retract and reassert without deleting.
- **co-06** (Theme F): Examples 28 through 33 read as-of, since, history, and audits.
- **co-07** (Theme D): Examples 16 through 21 match, join, filter, project, union, and negate.
- **co-08** (Themes D and E): Examples 17, 22, and 23 bind shared variables and pin constants.
- **co-09** (Theme E): Examples 24 through 27 name, chain, recurse, and deduplicate rules.
- **co-10** (Theme G): Examples 34 through 38 sort four ways, seek, price writes, and slice ranges.
- **co-11** (Themes B and H): Examples 8, 9, 39, and 43 contrast one-valued and set-valued slots.
- **co-12** (Theme H): Examples 39 through 42 point, traverse, and own references.
- **co-13** (Themes A, C, and I): Examples 5, 8, 12, and 44 through 46 store history and price it.
- **co-14** (Themes C, F, and G): Examples 28, 37, and 45 read snapshots without locks.
- **co-15** (Themes B and H): Examples 10 and 43 evolve the schema by addition.
- **co-16** (Theme I): Examples 46 through 48 score the workload and name the limits.

## How to use this page in a study group

Run recall aloud in pairs: one person asks, the other answers without looking, and the details block judges. Time applied problems to twenty minutes each and compare approaches before reading the expected lines, because two different routes to the same verdict both count. Do katas driver-and-navigator style with one keyboard, swapping at each TODO. Score the checklist privately first, then confess unchecked lines to the group and assign re-reads from the index below. Close with one interrogation question debated for ten minutes: the side that steelmans the rejected alternative wins.

## Worked example quick-jump

Every worked example in one line: its theme and its takeaway. Jump back to any of them when a drill stalls.

- **Worked Example 1: First Datom** (Theme A): A datom is one immutable fact: entity, attribute, value, and transaction, always together.
- **Worked Example 2: One Entity, Many Datoms** (Theme A): An entity is whatever its datoms say about it; the entity id is the only glue.
- **Worked Example 3: Identity Is Not Its Attributes** (Theme A): Tempids are conversation; entity ids are storage. Facts keep only the latter.
- **Worked Example 4: Reading a Datom Apart** (Theme A): Positions carry the meaning: entity, attribute, value, transaction, in that order.
- **Worked Example 5: Facts Are Never Overwritten** (Theme A): Corrections append; the log never rewrites. History is the default, not a feature.
- **Worked Example 6: Declaring the Schema** (Theme B): Schema declares slots with types and cardinality before any datom is written.
- **Worked Example 7: Types Are Checked at Write Time** (Theme B): The schema gate runs before the log: bad types never become facts.
- **Worked Example 8: Cardinality One Keeps One Current Value** (Theme B): Cardinality one means one current value, never one stored fact.
- **Worked Example 9: Cardinality Many Accumulates a Set** (Theme B): Cardinality many is a set: each assert adds, none replaces.
- **Worked Example 10: New Attributes Arrive Without Migration** (Theme B): Schema evolution adds slots; existing datoms never move.
- **Worked Example 11: Transactions Land as One Batch** (Theme C): A transaction is an atomic batch: validated whole, installed whole.
- **Worked Example 12: Retraction Marks, Never Erases** (Theme C): Retraction ends a fact's present without touching its past.
- **Worked Example 13: Reasserting Builds a Timeline** (Theme C): Reassertion chains eras: each value owns the interval until the next.
- **Worked Example 14: Every Transaction Signs Its Work** (Theme C): Transactions carry their own metadata: instant and actor ride along.
- **Worked Example 15: Conditional Writes Prevent Lost Updates** (Theme C): Preconditions turn races into verdicts: fresh wins, stale is refused.
- **Worked Example 16: Your First Datalog Query** (Theme D): A query describes the answer's shape; the engine does the searching.
- **Worked Example 17: Joins Are Shared Variables** (Theme D): Repeat a variable across clauses and the engine joins on it.
- **Worked Example 18: Predicates Filter Bindings** (Theme D): Predicates prune bindings after patterns produce them.
- **Worked Example 19: Project Only What You Need** (Theme D): Projection narrows bindings to the columns the caller was promised.
- **Worked Example 20: Either Clause Can Match** (Theme D): Union answers when any branch matches; duplicates collapse automatically.
- **Worked Example 21: Proving Something Is Missing** (Theme D): Negation is set difference against an explicit universe.
- **Worked Example 22: One Variable, One Value** (Theme E): A repeated variable is a constraint: every occurrence binds the same value.
- **Worked Example 23: Constants Narrow the Search** (Theme E): A constant in a clause demands exactly that value, nothing else.
- **Worked Example 24: Name a Pattern Once, Reuse It Twice** (Theme E): Rules name reusable clause patterns so every caller shares one definition.
- **Worked Example 25: Rules Build on Rules** (Theme E): Rules chain: small tested layers compose into policy answers.
- **Worked Example 26: Recursion Walks the Assembly Tree** (Theme E): Recursive rules follow links to their fixpoint; cycles would loop forever.
- **Worked Example 27: One Rule Beats Three Copies** (Theme E): Copies agree until the policy changes; rules agree afterwards too.
- **Worked Example 28: Asking the Database Last March** (Theme F): As-of reads the database as it stood at any past transaction.
- **Worked Example 29: The Full Life of One Price** (Theme F): History replays every era: asserts open them, retractions close them.
- **Worked Example 30: Who Changed the Price** (Theme F): Transaction ids join facts to their authors: change meets accountability.
- **Worked Example 31: What Is New Since Tuesday** (Theme F): Since-queries return everything strictly newer than a watermark transaction.
- **Worked Example 32: Joining as of Last Quarter** (Theme F): Time-travel joins reuse today's logic on yesterday's prices.
- **Worked Example 33: Deleted Now, Visible Then** (Theme F): Retracted facts stay visible to every transaction before their retraction.
- **Worked Example 34: Sorting by Entity First** (Theme G): EAVT order clusters one entity's facts into one contiguous run.
- **Worked Example 35: Sorting by Attribute First** (Theme G): AEVT order clusters one attribute's facts into one contiguous run.
- **Worked Example 36: Seeking Beats Scanning** (Theme G): Indexes convert linear scans into positioned seeks with counted savings.
- **Worked Example 37: Every Index Is Paid at Write Time** (Theme G): Each index is maintained per write: reads borrow against transact time.
- **Worked Example 38: Range Scans Ride Value Order** (Theme G): Value-ordered runs answer range queries with one slice.
- **Worked Example 39: Tagging Without a Side Table** (Theme H): Set-valued attributes answer membership questions with one clause.
- **Worked Example 40: Attributes That Point at Entities** (Theme H): Reference attributes store entity ids, turning facts into a traversable graph.
- **Worked Example 41: Walking Two Hops to the City** (Theme H): Multi-hop traversals chain one shared variable per hop.
- **Worked Example 42: Owned Parts Versus Shared Customers** (Theme H): Components die with their parent; referenced entities outlive any single user.
- **Worked Example 43: Changing Cardinality Without Breaking Readers** (Theme H): Cardinality changes add slots; old readers keep working during the transition.
- **Worked Example 44: History Has a Storage Price** (Theme I): Append-only storage grows with every change; mutable cells stay constant.
- **Worked Example 45: Readers Never Block Writers** (Theme I): Snapshot reads are lock-free: the pinned past cannot move under the reader.
- **Worked Example 46: Counters Are the Worst Case** (Theme I): High-churn counters explode under append-only; roll them up before storing.
- **Worked Example 47: Transitive Closure in Three Clauses** (Theme I): Recursive questions stay small in Datalog; aggregation at scale may not.
- **Worked Example 48: Should This Workload Be Facts** (Theme I): Score audit need, history reads, write calm, and relationships before choosing.

## Theme re-read map

When a recall question wobbles, re-read exactly the theme below before retrying it.

### Theme A: Datoms and Entities

Hesitation on what a fact is sends you back to Examples 1 and 4: one tuple, four positions, printed apart. Re-run both, then explain aloud why the entity id is the only glue before moving on.

### Theme B: Schema and Attributes

Hesitation on types or cardinality sends you back to Examples 7 through 9: the gate, the set, and the single current value. Write one new attribute declaration from scratch, then re-check its reads.

### Theme C: Transactions and Retraction

Hesitation on atomicity or retraction sends you back to Examples 11 and 12: the refused batch and the surviving past. Rehearse the compare-and-swap in Example 15 until the loser case feels obvious.

### Theme D: Basic Datalog Queries

Hesitation on joins or negation sends you back to Examples 17 and 21: the shared variable and the bounded universe. Re-derive the union in Example 20 branch by branch before trusting it.

### Theme E: Unification and Rules

Hesitation on variables or recursion sends you back to Examples 22 and 26: the twice-bound ?c and the shrinking assembly walk. State each termination argument aloud; mumbling means re-reading.

### Theme F: As-of and History Queries

Hesitation on time travel sends you back to Examples 28 and 33: the March price and the visible-then red. Re-run the invoice pair in Example 32 until era pinning feels mechanical.

### Theme G: Indexes

Hesitation on orderings sends you back to Examples 34 and 38: the entity run and the value slice. Re-count the seek in Example 36 by hand; the arithmetic is the whole lesson.

### Theme H: Cardinality and References

Hesitation on sets or pointers sends you back to Examples 39 and 41: the commuter clause and the two-hop walk. Redraw the ownership split in Example 42 from memory.

### Theme I: Trade-offs and When to Use This Model

Hesitation on the verdict sends you back to Examples 46 and 48: the thousand-datom counter and the four-feature score. Score one real workload from your own work before calling the theme done.

## Glossary of the sixteen concepts

- **datom**: one immutable fact as entity, attribute, value, and transaction.
- **entity**: an identity that datoms describe; the id is the only container.
- **attribute-schema**: a declared slot with a value type and a cardinality.
- **transaction**: an atomic, stamped batch of asserted or retracted datoms.
- **retraction**: a closing stamp that ends a fact's present, never its past.
- **as-of-query**: a read filtered to transactions at or before a target.
- **datalog-query**: declarative clauses over facts returning shared bindings.
- **unification**: the rule that one variable binds one value everywhere.
- **rule**: a named, reusable clause pattern, possibly recursive.
- **index**: one sorted order over the datoms serving one question family.
- **cardinality**: whether an attribute holds one current value or a set.
- **reference-attribute**: an attribute whose value is another entity's id.
- **append-only-log**: storage that grows with every change and never rewrites.
- **read-scalability**: snapshot reads that need no locks because the past is fixed.
- **schema-evolution**: adding attributes without migrating existing datoms.
- **trade-off-vs-mutable-db**: the storage, speed, and honesty comparison guiding adoption.
