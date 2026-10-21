# Capstone: Sinar Abadi September restock, profile to page.
# => Sinar Abadi, its receipts, and its catalog are fictional and fixed.
# => Twelve receipts with planted warts; one catalog orphan on purpose.
# => Profile, clean by policy, join, aggregate, plot, then report.
import csv
import sqlite3
import statistics

# => Load the committed sales fixture exactly as exported.
with open(
    "sales.csv", newline="", encoding="utf-8"
) as handle:  # => fixed text settings
    raw = list(csv.DictReader(handle))  # => header becomes the keys
# => Load the committed catalog fixture exactly as maintained.
with open(
    "products.csv", newline="", encoding="utf-8"
) as handle:  # => fixed text settings
    products = list(csv.DictReader(handle))  # => header becomes the keys
# => PROFILE: shape, holes, doubles, and extremes, changing nothing.
print("profile_rows:", len(raw))  # => Output counts the exported rows
holes = sum(1 for r in raw if r["qty"].strip() == "")  # => blank quantities
print("profile_missing:", holes)  # => Output counts the one blank
keys = [r["order_id"] for r in raw]  # => order ids, doubled by re-export
print("profile_dupes:", len(keys) - len(set(keys)))  # => Output counts the repeat
# => CLEAN: normalize text, median-fill the hole, newest stamp survives.
clean = {}  # => order id to winning row
qtys = sorted(
    int(r["qty"]) for r in raw if r["qty"].strip() != ""
)  # => known quantities
fill = statistics.median(qtys)  # => median of the survivors
for r in raw:  # => visit each export row once
    code = r["code"].strip().lower()  # => Example 6 policy
    qty = int(r["qty"]) if r["qty"].strip() != "" else int(fill)  # => Example 9 policy
    key, stamp = r["order_id"], r["updated"]  # => identity and correction order
    if key not in clean or stamp > clean[key][4]:  # => Example 10 survivor rule
        clean[key] = (key, r["date"], code, qty, stamp)  # => install the survivor
print("clean_rows:", len(clean), "filled:", holes)  # => Output shows 11 rows, 1 fill
# => JOIN: sales meet the catalog; orphans checked before money moves.
db = sqlite3.connect(":memory:")  # => same SQL as the Postgres toolchain
db.execute(
    "CREATE TABLE sales(oid TEXT, date TEXT, code TEXT, qty INT)"
)  # => receipts schema
db.executemany(
    "INSERT INTO sales VALUES(?,?,?,?)",  # => load survivors
    [(v[0], v[1], v[2], v[3]) for v in clean.values()],
)  # => drop the stamp column
db.execute(
    "CREATE TABLE products(code TEXT, category TEXT, price INT)"
)  # => catalog schema
db.executemany(
    "INSERT INTO products VALUES(:code, :category, :unit_price)", products
)  # => load catalog
sales_orphans = db.execute(
    "SELECT DISTINCT code FROM sales "  # => sales keys unseen
    "WHERE code NOT IN (SELECT code FROM products)"
).fetchall()  # => anti-join
catalog_orphans = db.execute(
    "SELECT DISTINCT code FROM products "  # => catalog keys unsold
    "WHERE code NOT IN (SELECT code FROM sales)"
).fetchall()  # => anti-join back
print("sales_orphans:", [r[0] for r in sales_orphans])  # => Output lists unplaced sales
print("catalog_orphans:", [r[0] for r in catalog_orphans])  # => Output lists dead stock
# => AGGREGATE: revenue by category, units by month, means with n.
cats = db.execute(
    "SELECT p.category, SUM(s.qty * p.price) FROM sales s "  # => revenue per category
    "JOIN products p ON s.code = p.code GROUP BY p.category "  # => join then group
    "ORDER BY 2 DESC"
).fetchall()  # => winner first
print("by_category:", [(c, rev) for c, rev in cats])  # => Output ranks the categories
months = db.execute(
    "SELECT SUBSTR(date, 1, 7), SUM(qty) FROM sales "  # => two-key grouping
    "GROUP BY 1 ORDER BY 1"
).fetchall()  # => calendar order
print("by_month:", [(m, q) for m, q in months])  # => Output traces the quarter
baskets = [q for _, _, _, q, _ in clean.values()]  # => receipt quantities
print(
    f"basket mean {statistics.mean(baskets):.2f} "  # => Output states the center
    f"(stdev {statistics.stdev(baskets):.2f}, n={len(baskets)})."
)  # => Output adds spread, n
# => PLOT 1: category revenue bars on one fixed scale.
for cat, rev in cats:  # => winner first, as ranked
    print(f"{cat:8} {'#' * (rev // 100000)} {rev}")  # => Output draws each bar
# => PLOT 2: basket histogram on stated bins.
for label, lo, hi in [
    ("small 1-2 ", 1, 2),
    ("medium 3-4", 3, 4),
    ("large 5+  ", 5, 99),
]:  # => bin edges
    n = sum(1 for q in baskets if lo <= q <= hi)  # => count this bin
    print(f"{label} {'#' * n} {n}")  # => Output charts the bin
# => REPORT: question, method, finding, caveats, then the verdict.
print(
    "Q: restock two categories fully for October if September revenue tops 500000?"
)  # => the aim
print(
    "M: sales.csv 12 rows; strip+lower, median-fill 1, newest-stamp; sqlite3 left join."
)  # => the path
top = cats[0]  # => the winning category
print(
    f"F: {top[0]} leads at {top[1]}; basket mean {statistics.mean(baskets):.2f} "  # => the numbers
    f"(stdev {statistics.stdev(baskets):.2f}, n={len(baskets)})."
)  # => with uncertainty
print(
    "C: n=11, September-only, payday confound, syrup orphan unpriced."
)  # => the bounds
print(
    "verdict: restock staples fully; cooking halfway; hold drinks."
)  # => Output signs narrowly
