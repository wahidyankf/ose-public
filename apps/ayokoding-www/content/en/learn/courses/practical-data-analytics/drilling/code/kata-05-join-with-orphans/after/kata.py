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
