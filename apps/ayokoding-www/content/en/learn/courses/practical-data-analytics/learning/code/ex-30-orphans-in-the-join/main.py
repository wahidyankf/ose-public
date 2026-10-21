# Worked Example 30: Finding Orphan Keys
# => Sinar Abadi, its receipts, and its catalog are fictional and fixed.
# => One sale has no product; one product has no sale.
# => Anti-joins list the keys each side cannot place.
import csv
import sqlite3

# => An in-memory database: same SQL as the Postgres toolchain, zero services.
db = sqlite3.connect(":memory:")  # => throwaway, deterministic, offline
# => Load the committed sales fixture into its table.
with open(
    "sales.csv", newline="", encoding="utf-8"
) as handle:  # => fixed text settings
    sales = list(csv.DictReader(handle))  # => header becomes the keys
db.execute("CREATE TABLE sales(code TEXT)")  # => keys are all this check needs
db.executemany("INSERT INTO sales VALUES(:code)", sales)  # => load the keys
# => Load the committed catalog fixture into its table.
with open(
    "products.csv", newline="", encoding="utf-8"
) as handle:  # => fixed text settings
    products = list(csv.DictReader(handle))  # => header becomes the keys
db.execute("CREATE TABLE products(code TEXT)")  # => keys are all this check needs
db.executemany("INSERT INTO products VALUES(:code)", products)  # => load the keys
# => Sales codes the catalog cannot place: till errors or new products.
sales_orphans = db.execute(
    "SELECT DISTINCT s.code FROM sales s "  # => distinct unknown codes
    "WHERE s.code NOT IN (SELECT code FROM products)"
).fetchall()  # => anti-join one way
print("sales_orphans:", [r[0] for r in sales_orphans])  # => Output names mystery-box
# => Catalog codes with no sales: dead stock or seasonal gaps.
catalog_orphans = db.execute(
    "SELECT DISTINCT p.code FROM products p "  # => distinct unsold codes
    "WHERE p.code NOT IN (SELECT code FROM sales)"
).fetchall()  # => anti-join the other
print("catalog_orphans:", [r[0] for r in catalog_orphans])  # => Output names tea-100g
