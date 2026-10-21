---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

Drilling turns worked examples into durable skill: recall the concepts cold, apply them to new situations, repair broken starting points, check yourself honestly, and argue the design choices against their rejected alternatives. Work this page after the capstone, with a terminal open. Sinar Abadi and every company below are fictional.

Work each section in order and do not skip ahead. Read a recall question, answer aloud before opening its details block, and mark any hesitation as a re-read flag for the matching theme. Solve applied problems on paper or in a scratch file before reading their expected lines; the expected text confirms direction, not digits, so a different route to the same verdict still counts. Run every kata starter, watch it fail or print the wrong number, then fix it before comparing with the solution: the repair motion is the skill, not the final file. Score the checklist honestly at the end, and revisit any unchecked line in its theme before calling the course done.

## Recall Q&A

### Q1 (co-01): What does a data profile list before any cleaning starts?

<details>
<summary>Model answer</summary>

Shape, types, holes, doubles, and extremes: row and column counts, each column's usable type, missing-cell tallies, duplicate rows, and minima and maxima. Example 5 prints all six on one page. Profiling first matters because cleaning destroys information, and only the profile tells you what was there to destroy. Quote the profile at the top of every analysis so the reader inherits your orientation instead of repeating it.

</details>

### Q2 (co-01): Why do groups from a group-by have to sum back to the input?

<details>
<summary>Model answer</summary>

Because the split must be lossless: every row lands in exactly one pile, so pile sizes add up to the row count. Example 16 prints the total beside the piles as the checksum. A mismatch means rows leaked through a filter, a key typo, or a join that shrank, and any of those invalidates every aggregate built on top. Make the checksum a habit, not a ceremony.

</details>

### Q3 (co-02): What are the three honest missing-value policies, and what does each cost?

<details>
<summary>Model answer</summary>

Drop the hole, fill it with the median of the survivors, or keep the row and flag it. Example 9 runs all three on one column: dropping understates volume, filling invents data, flagging postpones the decision. The policy is part of the result, so print it in the method section. Prefer flagging when later steps tolerate holes, and filling only when a step needs complete rows.

</details>

### Q4 (co-02): Why is an explicit None better than a silent zero for a failed number coercion?

<details>
<summary>Model answer</summary>

Because zero means sold-for-nothing while None means unknown, and confusing them corrupts every total and average downstream. Example 7 parks unparseable prices as None so the missing-value policy of Example 9 fires visibly. A silent zero is a decision made by accident; an explicit None is a decision deferred to the right step.

</details>

### Q5 (co-03): How does Example 3's price max expose a data-entry slip the mean hides?

<details>
<summary>Model answer</summary>

The max reads 480000, an order of magnitude above every sibling price, while the mean barely moves because one row among ten cannot drag it far. Extremes are slip-detectors; centers are slip-absorbers. Always flank a quoted mean with its min and max, because the summary you skip is the error you publish.

</details>

### Q6 (co-03): What does the whopper in Example 25 do to the mean, and what resists it?

<details>
<summary>Model answer</summary>

One catering order of 40 drags the mean from 3.22 to 6.9 while the median stays at 3.0, because the mean spends every unit and the median only orders them. Skewed data earns the median; symmetric data earns the mean. Check skew with one subtraction before choosing the headline number for any slide.

</details>

### Q7 (co-04): What is the one text-cleaning rule of Example 6, and why that order?

<details>
<summary>Model answer</summary>

Strip whitespace, then fold case, the same way on every value before any comparison. Stripping first matters because case-folding never removes spaces, and comparing before cleaning counts Rice-5KG and rice-5kg as different products. Unclean text is the quietest way to double-count, and the groups of Theme D inherit the split silently.

</details>

### Q8 (co-04): How does Example 8 normalize three date shapes into one column?

<details>
<summary>Model answer</summary>

It tries each accepted format in turn, ISO, day-first numeric, and short-month text, and stores the winner as ISO YYYY-MM-DD, rejecting anything no format matches as None. One column holds one shape afterwards, so month cuts and sorts work. Keep the format list short and written down: each accepted shape is a promise the next export must keep.

</details>

### Q9 (co-05): What makes a table tidy, and what breaks when it is not?

<details>
<summary>Model answer</summary>

One observation per row and one variable per column. Example 14 checks both mechanically: uniform columns and a unique declared key. Untidy tables break reshapes, joins, and group-bys with numbers that look right and are not, because quarter-columns cannot be grouped and glued codes cannot be split downstream. Assert tidiness before reshaping, not after.

</details>

### Q10 (co-05): Why melt wide tables long before analyzing, per Example 11?

<details>
<summary>Model answer</summary>

Because wide tables make quarters into structure instead of data, so no group-by can touch them and adding a quarter rewrites everything. Melting fans each wide row into quarter-value pairs with nothing lost and everything groupable. Analyze long, present wide: Example 12 pivots back only for the slide, after the numbers are settled.

</details>

### Q11 (co-06): What is the group-by skeleton every Theme D example reuses?

<details>
<summary>Model answer</summary>

Split rows into piles under a key, summarize each pile from its kept raw list, and checksum the piles against the input. Example 17 keeps the value lists so any aggregate follows without rereading the file. The same loop carries tuple keys for two dimensions in Example 18 and a HAVING-style filter in Example 19.

</details>

### Q12 (co-06): Why must aggregation come before group filtering, per Example 19?

<details>
<summary>Model answer</summary>

Because the threshold applies to groups, not rows: filtering receipts first and then totaling answers which big receipts survive, a different question from which products clear the bar. Aggregate-then-filter is the whole point of HAVING, and reversing the order silently lies. Name the threshold as a constant so the next analyst can move it deliberately.

</details>

### Q13 (co-07): When do the mean, median, and mode disagree, and which do you quote?

<details>
<summary>Model answer</summary>

They disagree under skew or outliers: the promo day of Example 22 lifts the mean to 6.86 while median and mode stay with normal days at 5.0 and 4. Report the trio and name the one you trust: symmetric data earns the mean, skewed data earns the median, and repeating values earn the mode's attention. Quoting one center without the others chooses the story before the reader arrives.

</details>

### Q14 (co-07): What do range, variance, and standard deviation each add beyond the mean?

<details>
<summary>Model answer</summary>

Range gives the cheapest wobble as max minus min, variance averages the squared deviations for the record, and standard deviation translates that into felt units. Example 23 shows two shelves averaging 5.0 with deviations of 1.0 and 3.0: same center, opposite restock policies. Quote the deviation beside every mean, the way quartiles flank the median.

</details>

### Q15 (co-08): How does Example 42 measure sampling bias as a number?

<details>
<summary>Model answer</summary>

It divides the product's share in the Saturday survey by its share in the full week's sales: sugar reads 0.6 over 0.3, a 2.0-times over-representation. Shares turn a vague worry about who was asked into a measured distortion. Weight the survey back to the population or scope the claim to the sampled crowd; presenting Saturday as the week is how bias ships.

</details>

### Q16 (co-09): What does an inner join drop, a left join keep, and how do you reconcile them?

<details>
<summary>Model answer</summary>

Inner join keeps only keys present on both sides, dropping the mystery-box receipt of Example 28; left join keeps every driving-table row and labels the gaps UNMATCHED, as Example 29 does. Reconcile by counting both inputs and the output: 4 of 5 matched inner, 5 of 5 kept left with 1 labeled. Default to left when the driving table is the truth.

</details>

### Q17 (co-09): What is the fanout trap of Example 33, and what catches it?

<details>
<summary>Model answer</summary>

A doubled lookup key multiplies joined rows: two sugar sales meet two catalog rows and revenue doubles with every row looking legitimate. The guard groups the lookup side by key and fails on any count above one, run before every aggregation-after-join. When the check fires, fix the lookup table first; no downstream number built on a doubled join can be rescued.

</details>

### Q18 (co-10): Which question gets bars, lines, and histograms under Example 38's table?

<details>
<summary>Model answer</summary>

Comparing categories gets bars, change over time gets lines, and distribution shape gets histograms. The table turns taste into procedure: a line of categories implies a trend that does not exist, and a twelve-slice pie compares nothing. When no row fits, the question is two questions stapled together; split it before charting.

</details>

### Q19 (co-11): How does a truncated axis exaggerate, and how do you measure it?

<details>
<summary>Model answer</summary>

It hides the common baseline so only the surplus shows: Example 39's wobble from 104 to 114 reads 1.1 from zero but 3.5 from 100, an exaggeration factor of 3.2. The ratio of drawn heights turns a feeling into a quotable number. Start bars at zero always; start lines at zero unless variation genuinely lives far from it, and then label the break loudly.

</details>

### Q20 (co-11): What is cherry-picking a range, and what is its antidote?

<details>
<summary>Model answer</summary>

Computing the trend over a window chosen after the peak is known: Example 40's last four weeks rise 2.0 per week while the full twelve rise 0.18. The antidote is the same slope over everything, printed beside the zoom. Demand the window's justification in the method section: a promo calendar justifies a zoom, admiration for the slope does not.

</details>

### Q21 (co-12): What makes an analysis reproducible in this course's sense?

<details>
<summary>Model answer</summary>

A script that regenerates the same report from the same committed input on every run: fixed fixtures, stdlib only, no network, no clock reads, and the proof inside the script. Example 15 round-trips its reshape and compares every cell; the capstone reprints its profile, method, and caveats from the same run. Reproducibility is the rerun matching, not the code looking clean.

</details>

### Q22 (co-13): What four parts does an analytical question name, per Example 44?

<details>
<summary>Model answer</summary>

The decision it serves, the population it scopes, the metric it computes, and the threshold that flips the decision. Restock staples for October, September staples receipts, mean basket above 3: a question shaped like that cannot wander. Write it before touching the file and re-read it when a shiny side pattern waves.

</details>

### Q23 (co-14): What belongs in a caveat register, and why labeled?

<details>
<summary>Model answer</summary>

Every known limit with the concept that demands it: small-n, sampling skew, confounders, and refused causal leaps, as Example 47's four lines show. Labels turn limits into checkable scope instead of shameful footnotes. Four caveats is a floor: add each limit you know, because the omitted one is the one that bites.

</details>

### Q24 (co-15): Why does a correlation near 1.0 never license the word because?

<details>
<summary>Model answer</summary>

Because correlation measures co-movement and knows nothing of cause: Example 26's spend and revenue march together near 1.0 while payday weeks lift both. The number belongs in the finding and the confounder in the caveat, never merged into a causal sentence. A slope without a caveat becomes a policy by Monday.

</details>

### Q25 (co-16): What order do the four report sections follow, and why that order?

<details>
<summary>Model answer</summary>

Question, method, finding, caveats, per Example 48. The order is the argument: the question proves aim, the method proves checkability, the finding earns its numbers, and the caveats bound them. Any other order lets the conclusion audition before its evidence arrives. Memorize the four words; they shape every honest page.

</details>

## Applied problems

Solve each on paper or in a scratch file before reading its expected direction. The expected text confirms the verdict's direction, not its digits: a different route to the same verdict still counts, but a verdict pointing the other way fails no matter how neat the arithmetic.

### AP1: Decide a missing-value policy for a returns column that is blank on 40 percent of rows

Expected direction: Dropping loses nearly half the file and probably the unhappiest buyers, so dropping is out. Median-filling 40 percent manufactures the typical rating hundreds of times and crushes the spread, so filling is out too. Flag the holes and report kept-only versus all-known side by side, exactly the Example 41 split. Expected direction: a flagged analysis whose headline admits the 40 percent unknown, not a filled number that hides it.

### AP2: Spot the misleading chart: a vendor plots six weeks of revenue from a baseline of 28 with an arrow from spend to sales. Redesign it

Expected direction: Two tricks stack: a truncated axis that inflates a calm series, and a causal arrow that correlation cannot license. Redraw from zero per Example 39, drop the arrow per Example 43, and print the honest max-to-min ratio beside the vendor's. Expected direction: same six numbers, calm bars, no arrow, and one sentence refusing the causal claim with the payday confounder named.

### AP3: Separate a found correlation from a claimed cause in the discount-basket scatter of Example 37

Expected direction: The grid slopes up and the correlation reads high, which licenses only togetherness: discount weeks may coincide with paydays, holidays, or better shelf placement. A cause needs a tested lever, same discount across matched weeks or a controlled promo window, none of which the fixture holds. Expected direction: keep the plot, keep the number, replace shop-tested language with a confounder list and a proposal for the experiment that could earn because.

### AP4: A category manager asks for average revenue per product across categories with 2, 11, and 40 receipts. What do you deliver?

Expected direction: Three means on wildly unequal footing: the n=2 mean is a rumor, the n=40 mean is evidence, and ranking them side by side invites the Example 21 fallacy. Deliver each mean with its n and a small-pile flag under the stated floor, plus the pooled receipt count. Expected direction: a ranked table where the flag column, not the mean column, drives the restock caution.

### AP5: The catalog team merged two suppliers and product codes now repeat with different packs. The monthly revenue doubled. Diagnose it

Expected direction: Classic fanout per Example 33: each sale now meets every duplicate catalog row and revenue multiplies by the duplication count. Run the lookup-side uniqueness check grouped by code, list the duplicated keys, and freeze the report until the catalog is deduped under a survivor rule. Expected direction: the doubled total traced to named duplicate keys, not a demand surge.

### AP6: A wide export adds a thirteenth month column and every downstream query breaks. What structure do you adopt?

Expected direction: The queries name month-columns, so structure changed under them. Melt to long per Example 11 with month as data, keep the melt script committed, and point every query at the tidy table; pivot wide only for the slide per Example 12. Expected direction: one reshape script plus queries that survive the fourteenth month untouched.

### AP7: Two shelves average 10 units a day. One must be cut. What else do you compute before choosing?

Expected direction: The Example 27 trap: identical means hiding opposite shapes. Compute ranges and standard deviations, check minima for stockout days, and read the daily sequences for feast-or-famine patterns. Expected direction: cut the volatile shelf only with a buffer plan, or cut the steady underperformer, stated with the spread numbers that justify which risk you chose.

### AP8: Scope a one-page report for whether the October promo lifted baskets, given Saturday-only survey data and a payday overlap

Expected direction: Question names the promo decision, October baskets, mean lift above a stated bar. Method lists the Saturday scope and payday overlap up front. Finding carries center, spread, and n. Caveats register sampling per co-08 and confounding per co-15, refusing causation. Expected direction: a page that recommends at most a wider experiment, never a rollout, because the data cannot carry the claim.

## Code katas

Each kata lives under `drilling/code/kata-NN-<slug>/` with a `before/kata.py` starter, an `after/kata.py` solution, and a `run.yaml` that runs the solution. Work the starter first with the lesson examples closed, then compare against the solution and re-run to verify. The repair motion is the skill: a kata only counts when you have watched the starter fail, fixed it yourself, and seen the harness agree.

- Kata 01, profile a messy fixture and list its quality problems. **`drilling/code/kata-01-profile-messy-fixture/after/kata.py`**: Read the six-row fixture cold and print shape, missing cells, duplicate orders, and the price extremes. The starter counts rows but skips every check, printing zeros that look finished. Fill the four checks from Examples 1 to 4: blank scan, order-id fingerprinting, and min-max over the price column. Solution prints 6 rows, 1 missing cell, 1 duplicate order, and the 480000 max that flags the slip.
- Kata 02, write a group-by aggregation with a stated caveat. **`drilling/code/kata-02-group-by-with-caveat/after/kata.py`**: Total September units per product and attach each pile's size, flagging piles below three rows. The starter prints bare means that rank the single-receipt product first. Add the n beside every mean from Example 21 and the FLAG-SMALL marker under the floor. Solution prints rice 3.0 on n=4 trusted, sugar 4.0 on n=3 trusted, and oil flagged on n=1.
- Kata 03, fix a chart that implies causation. **`drilling/code/kata-03-fix-causal-chart/after/kata.py`**: The starter draws discount against baskets, prints a high correlation, and signs off with because language the data cannot carry. Remove the causal sentence, replace it with the payday confounder from Example 26, and keep the honest number. Solution prints the correlation above 0.9 with a caveat line refusing the causal claim.
- Kata 04, tidy a wide monthly table. **`drilling/code/kata-04-tidy-wide-table/after/kata.py`**: Melt the two-products-by-three-months export into tidy rows with one observation per row. The starter copies values into the wrong months, shifting every figure one column right. Fan out one pair per month column per Example 11 and verify six tidy rows come out. Solution prints 6 tidy rows with rice month 1 at 120.
- Kata 05, join sales while handling orphan keys. **`drilling/code/kata-05-join-with-orphans/after/kata.py`**: Join the four receipts to the three-row catalog without silently dropping the unknown code. The starter inner-joins and reports 3 of 4 matched as if the fourth never existed. Switch to a left join with the UNMATCHED label from Example 29 and list the orphan for the catalog team per Example 30. Solution prints 4 surviving rows with 1 labeled and names the orphan.

### Kata 01 solution: Profile a messy fixture and list its quality problems

**After** (`drilling/code/kata-01-profile-messy-fixture/after/kata.py`)

```python
# Kata 01 solution: profile the messy fixture, four checks filled.
# => Sinar Abadi and its fixture are fictional; every row is fixed.
# => Shape plus holes, doubles, and extremes: the Example 5 handoff.
import csv

# => Open the committed fixture that ships with this kata.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
    names = list(rows[0].keys())  # => keep the column order
# => Blank cells anywhere in the file.
missing = sum(1 for r in rows for n in names if r[n].strip() == "")  # => the one hole
# => Order ids appearing more than once.
ids = [r["order_id"] for r in rows]  # => the candidate key
dupes = len(ids) - len(set(ids))  # => repeats beyond first sightings
# => Price extremes over the filled cells.
prices = [float(r["price"]) for r in rows if r["price"].strip() != ""]  # => survivors
print("rows:", len(rows))  # => Output counts the six receipts
print("missing:", missing)  # => Output reads 1
print("dupes:", dupes)  # => Output reads 1
print("price:", int(min(prices)), int(max(prices)))  # => Output shows 17500 480000
```

**Output** (`drilling/code/kata-01-profile-messy-fixture/expected/main.stdout.txt`):

```text
rows: 6
missing: 1
dupes: 1
price: 17500 480000
```

### Kata 02 solution: Write a group-by aggregation with a stated caveat

**After** (`drilling/code/kata-02-group-by-with-caveat/after/kata.py`)

```python
# Kata 02 solution: group means with n attached and small piles flagged.
# => Sinar Abadi and its fixture are fictional; every row is fixed.
# => The Example 21 habit: no mean travels without its pile size.
import csv
import statistics

# => The smallest pile trusted without a warning, stated not hidden.
FLOOR = 3  # => groups below this get flagged

# => Open the committed fixture that ships with this kata.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => One value list per product, gathered in a single pass.
piles = {}  # => product to list of quantities
for row in rows:  # => visit each receipt once
    piles.setdefault(row["product"], []).append(int(row["qty"]))  # => file the quantity
# => Report each pile with its size, mean, and trust flag.
for product in sorted(piles):  # => fixed order, every run
    vals = piles[product]  # => the raw list for this pile
    flag = "ok" if len(vals) >= FLOOR else "FLAG-SMALL"  # => the stated floor decides
    print(
        product,
        "n:",
        len(vals),
        "mean:",  # => Output prints size and center
        round(statistics.mean(vals), 2),
        flag,
    )  # => Output prints the flag
```

**Output** (`drilling/code/kata-02-group-by-with-caveat/expected/main.stdout.txt`):

```text
oil-2l n: 1 mean: 4 FLAG-SMALL
rice-5kg n: 4 mean: 3 ok
sugar-1kg n: 3 mean: 4 ok
```

### Kata 03 solution: Fix a chart that implies causation

**After** (`drilling/code/kata-03-fix-causal-chart/after/kata.py`)

```python
# Kata 03 solution: the number stays, the causal leap goes.
# => Sinar Abadi and its promo weeks are fictional; every cell is fixed.
# => Correlation kept, confounder named, prescription refused.
import statistics

# => Six weeks of discount percent, fixed for the kata.
discount = [0, 5, 10, 15, 20, 25]  # => the suspected lever
# => Six weeks of basket size, fixed for the kata.
basket = [2, 3, 4, 5, 6, 8]  # => the hoped-for response
# => The correlation measures co-movement and nothing more.
print(
    "correlation:", round(statistics.correlation(discount, basket), 4)
)  # => Output reads high
# => Payday weeks lift both series, so the number cannot prescribe.
print(
    "caveat: payday calendar confounds both; no causal claim."
)  # => Output refuses the leap
```

**Output** (`drilling/code/kata-03-fix-causal-chart/expected/main.stdout.txt`):

```text
correlation: 0.9897
caveat: payday calendar confounds both; no causal claim.
```

### Kata 04 solution: Tidy a wide monthly table

**After** (`drilling/code/kata-04-tidy-wide-table/after/kata.py`)

```python
# Kata 04 solution: melt wide to long, each month with its own value.
# => Sinar Abadi and its export are fictional; every cell is fixed.
# => One pair per month column; values ride along untouched.
import csv

# => Open the committed wide fixture that ships with this kata.
with open("data.csv", newline="", encoding="utf-8") as handle:  # => fixed text settings
    rows = list(csv.DictReader(handle))  # => header becomes the keys
# => Melt: each wide row fans out into one tidy row per month.
months = ["m1", "m2", "m3"]  # => the month columns in order
tidy = 0  # => tidy rows emitted
for row in rows:  # => visit each product once
    for month in months:  # => visit each month column
        print(row["product"], month, row[month])  # => Output prints the true pair
        tidy += 1  # => count the emitted row
print("tidy_rows:", tidy)  # => Output reads 6
```

**Output** (`drilling/code/kata-04-tidy-wide-table/expected/main.stdout.txt`):

```text
rice-5kg m1 120
rice-5kg m2 135
rice-5kg m3 128
sugar-1kg m1 90
sugar-1kg m2 95
sugar-1kg m3 88
tidy_rows: 6
```

### Kata 05 solution: Join sales while handling orphan keys

**After** (`drilling/code/kata-05-join-with-orphans/after/kata.py`)

```python
# Kata 05 solution: left join keeps every sale; orphans get listed.
# => Sinar Abadi, its receipts, and its catalog are fictional and fixed.
# => No receipt vanishes; the gap becomes a work ticket, not a mystery.
import csv
import sqlite3

# => An in-memory database: same SQL as the Postgres toolchain, zero services.
db = sqlite3.connect(":memory:")  # => throwaway, deterministic, offline
# => Load the committed sales fixture into its table.
with open(
    "sales.csv", newline="", encoding="utf-8"
) as handle:  # => fixed text settings
    sales = list(csv.DictReader(handle))  # => header becomes the keys
db.execute(
    "CREATE TABLE sales(order_id TEXT, code TEXT, qty INT)"
)  # => receipts schema
db.executemany(
    "INSERT INTO sales VALUES(:order_id, :code, :qty)", sales
)  # => load the rows
# => Load the committed catalog fixture into its table.
with open(
    "products.csv", newline="", encoding="utf-8"
) as handle:  # => fixed text settings
    products = list(csv.DictReader(handle))  # => header becomes the keys
db.execute("CREATE TABLE products(code TEXT, category TEXT)")  # => catalog schema
db.executemany(
    "INSERT INTO products VALUES(:code, :category)", products
)  # => load the rows
# => Left join: every sale survives, gaps get labeled openly.
joined = db.execute(
    "SELECT s.order_id, s.code, COALESCE(p.category, 'UNMATCHED') "  # => label gaps
    "FROM sales s LEFT JOIN products p ON s.code = p.code "  # => sales drive it
    "ORDER BY s.order_id"
).fetchall()  # => stable order
for row in joined:  # => one line per sale, all four
    print(row)  # => Output prints each labeled row
# => The orphan list is the catalog team's work ticket.
print(
    "orphans:", [r[1] for r in joined if r[2] == "UNMATCHED"]
)  # => Output names mystery-box
```

**Output** (`drilling/code/kata-05-join-with-orphans/expected/main.stdout.txt`):

```text
('1', 'rice-5kg', 'staples')
('2', 'sugar-1kg', 'staples')
('3', 'mystery-box', 'UNMATCHED')
('4', 'rice-5kg', 'staples')
orphans: ['mystery-box']
```

## Self-check checklist

Score honestly: check a line only when you have done the thing in this course's fixture, not merely read about it. Revisit any unchecked line in its theme before calling the course done.

1. I can profile a new CSV for shape, types, holes, doubles, and extremes before cleaning it (co-01).
2. I can reconcile group sizes back to the input row count after every group-by (co-01).
3. I can run drop, median-fill, and flag policies side by side and compare their totals (co-02).
4. I can park failed number coercions as explicit None instead of silent zero (co-02).
5. I can flank every quoted mean with its min and max before trusting it (co-03).
6. I can normalize text columns with strip-plus-lowercase before any comparison (co-04).
7. I can parse mixed date formats against a written list and store ISO (co-04).
8. I can assert one-observation-per-row and unique keys mechanically on a new file (co-05).
9. I can melt a wide table long and round-trip it without losing a cell (co-05).
10. I can group by one key and by two keys with tuple labels (co-06).
11. I can filter groups by a threshold after aggregating, never before (co-06).
12. I can rank grouped totals and print the covered total beside the ranks (co-06).
13. I can compute mean, median, and mode together and name the one you trust (co-07).
14. I can report standard deviation and quartiles beside every headline center (co-07).
15. I can flag groups below the stated size floor instead of quoting their means quietly (co-14).
16. I can compare a survey mix against the population mix as shares before believing it (co-08).
17. I can join two tables in SQL and count both inputs against the output (co-09).
18. I can run orphan checks in both directions before trusting a joined total (co-09).
19. I can assert lookup-key uniqueness before every aggregation-after-join (co-09).
20. I can route a question to bars, lines, or histograms from the decision table (co-10).
21. I can measure a truncated axis as the ratio of drawn heights (co-11).
22. I can state the confounder beside every correlation you quote (co-15).
23. I can write a script that regenerates its report byte-identically on rerun (co-12).
24. I can assemble a one-page report ordered as question, method, finding, caveats (co-16).

## Elaborative interrogation & self-explanation

Each prompt names a design choice and its rejected alternative. Answer aloud before reading the model answer, and argue the other side briefly: a choice you cannot defend against its alternative is a habit, not a decision.

### E1: Why median-fill instead of mean-fill for the missing quantity in Example 9?

Model answer: The mean spends the whopper while the median only orders the survivors, so one large basket would inflate every filled hole under mean-fill. Median-fill resists the extremes Examples 3 and 25 warn about. Rejected alternative: mean-fill, which is fine only on symmetric data you have already checked, a check the hole itself prevents. Answer: median-fill because the fill must survive the skew it cannot see.

### E2: Why inner join in Example 28 but left join in Example 29 on the same tables?

Model answer: Example 28 asks what the catalog explains, a question about matched keys where dropping orphans is the point. Example 29 asks what the till collected, a question about money where dropping a sale is a lie. Rejected alternative: one join for both, which either inflates coverage or deflates revenue. Answer: the driving question picks the join, never habit.

### E3: Why sqlite3 in-process instead of the Postgres service for Theme F?

Model answer: The joins exercise SELECT, JOIN, GROUP BY, and HAVING semantics identical to the catalog's Postgres toolchain, while staying inside the standard library with zero services and deterministic reruns. A service container would add startup order, credentials, and network surface to a lesson about join logic. Rejected alternative: real Postgres per analysis, correct for production pipelines, overkill for learning join semantics. Answer: same SQL, none of the operations burden.

### E4: Why text plots instead of a plotting library for Theme G?

Model answer: The standard-library-only rule keeps the toolchain hash-locked with no third-party data-science stack, and text marks on fixed scales teach encoding honesty without API surface. A library would add dependency weight while hiding the scale choices this theme exists to expose. Rejected alternative: a chart library, right for board packs, wrong for learning what bars and bins actually encode. Answer: coarse marks that show the mechanism beat fine pixels that hide it.

### E5: Why report spread and n with every finding instead of the cleaner single number?

Model answer: A single number prints 3.0 from four receipts exactly like 3.0 from four thousand, borrowing authority it did not earn. Spread and n price the evidence beside the claim so the reader, not the formatting, judges strength. Rejected alternative: the clean headline with caveats elsewhere, which separates the persuasion from its price. Answer: the trio format makes weak evidence embarrass itself in print.

### E6: Why question-first instead of exploring first and writing the question after?

Model answer: A question written after the results is a justification wearing a lab coat: any pattern can be promoted to the aim it never served. Asking first turns the threshold into a contract the data can fail. Rejected alternative: pure exploration, valuable for learning a new domain but reportable only after a real question is retrofitted honestly. Answer: the aim must predate the data's vote, or the vote is rigged.
