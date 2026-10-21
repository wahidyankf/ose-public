# Worked Example 28: Inner Join, Sales Meet Products
# => Sinar Abadi, its receipts, and its catalog are fictional and fixed.
# => One receipt names a product the catalog never heard of.
# => Inner join keeps only the keys both tables share.
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
# => Inner join: matched keys only, category rides along with each receipt.
joined = db.execute(
    "SELECT s.order_id, s.code, p.category, s.qty "  # => pick the useful columns
    "FROM sales s JOIN products p ON s.code = p.code "  # => match on the code
    "ORDER BY s.order_id"
).fetchall()  # => stable order for the report
# => Show the joined rows: receipts enriched with their categories.
for row in joined:  # => one line per matched receipt
    print(row)  # => Output prints four enriched rows
# => Four of five receipts survive: the mystery box has no catalog entry.
print("matched:", len(joined), "of", len(sales))  # => Output reads 4 of 5
