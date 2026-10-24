# Worked Example 33: The Fanout Trap, Duplicate Keys
# => Sinar Abadi, its receipts, and its catalog are fictional and fixed.
# => Sugar appears twice in the catalog; its two sales double to four.
# => Show the fanout, then assert lookup-key uniqueness to catch it.
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
db.execute("CREATE TABLE products(code TEXT, pack TEXT)")  # => catalog schema
db.executemany(
    "INSERT INTO products VALUES(:code, :pack)", products
)  # => load the rows
# => The naive join multiplies: each sale meets every matching catalog row.
naive = db.execute(
    "SELECT COUNT(*) FROM sales s "  # => count the joined rows
    "JOIN products p ON s.code = p.code"
).fetchone()[0]  # => fanout happens here
print(
    "sales_rows:", len(sales), "joined_rows:", naive
)  # => Output shows 2 sales, 4 joined
# => The guard: every lookup key must appear exactly once.
dupes = db.execute(
    "SELECT code FROM products GROUP BY code "  # => group the lookup side
    "HAVING COUNT(*) > 1"
).fetchall()  # => keys that fan out
print("dupe_keys:", [r[0] for r in dupes])  # => Output names sugar-1kg
print("fanout:", naive != len(sales))  # => Output reads True: the trap fired
