# Worked Example 29: Left Join, Keeping Every Sale
# => Sinar Abadi, its receipts, and its catalog are fictional and fixed.
# => The mystery-box sale is real money with no catalog entry.
# => Left join keeps every receipt; gaps get a label, never silence.
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
db.execute(
    "CREATE TABLE products(code TEXT, category TEXT, pack TEXT)"
)  # => catalog schema
db.executemany(
    "INSERT INTO products VALUES(:code, :category, :pack)", products
)  # => load the rows
# => Left join: every sale survives, missing categories get labeled.
joined = db.execute(
    "SELECT s.order_id, s.code, COALESCE(p.category, 'UNMATCHED') "  # => label the gaps
    "FROM sales s LEFT JOIN products p ON s.code = p.code "  # => sales drive the join
    "ORDER BY s.order_id"
).fetchall()  # => stable order for the report
# => Show every surviving receipt with its category or its label.
for row in joined:  # => one line per sale, all five
    print(row)  # => Output prints five rows, one labeled
# => Exactly one receipt needs catalog attention.
unlabeled = sum(
    1 for row in joined if row[2] == "UNMATCHED"
)  # => count the labeled gaps
print(
    "rows:", len(joined), "unmatched:", unlabeled
)  # => Output reads 5 rows, 1 unmatched
