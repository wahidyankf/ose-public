# Kata 05 starter: an inner join that drops the stranger silently.
# => Sinar Abadi, its receipts, and its catalog are fictional and fixed.
# => TODO: keep every sale, label the gap, list the orphan for the catalog team.
import csv
import sqlite3

db = sqlite3.connect(":memory:")  # => throwaway, deterministic, offline
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
with open(
    "products.csv", newline="", encoding="utf-8"
) as handle:  # => fixed text settings
    products = list(csv.DictReader(handle))  # => header becomes the keys
db.execute("CREATE TABLE products(code TEXT, category TEXT)")  # => catalog schema
db.executemany(
    "INSERT INTO products VALUES(:code, :category)", products
)  # => load the rows
# => TODO: BUG, inner join drops the mystery box without a word.
joined = db.execute(
    "SELECT s.order_id, s.code FROM sales s "  # => TODO: LEFT JOIN + label
    "JOIN products p ON s.code = p.code ORDER BY s.order_id"
).fetchall()  # => silent drop
print("matched:", len(joined), "of", len(sales))  # => prints 3 of 4, no explanation
