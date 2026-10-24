# Worked Example 31: Aggregating After the Join
# => Sinar Abadi, its receipts, and its catalog are fictional and fixed.
# => Quantities meet prices in the join; categories group the revenue.
# => Join first, price each row, then sum per category.
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
    "CREATE TABLE products(code TEXT, category TEXT, unit_price INT)"
)  # => price lives here
db.executemany(
    "INSERT INTO products VALUES(:code, :category, :unit_price)", products
)  # => load the rows
# => Join, price each receipt, then sum inside each category.
rows = db.execute(
    "SELECT p.category, SUM(s.qty * p.unit_price) "  # => revenue per category
    "FROM sales s JOIN products p ON s.code = p.code "  # => match on the code
    "GROUP BY p.category ORDER BY p.category"
).fetchall()  # => stable category order
# => Show each category with its revenue total.
for category, revenue in rows:  # => one line per category
    print(category, revenue)  # => Output prints staples 585000, cooking 96000
# => Joined rows reconcile the money back to four receipts.
print(
    "joined_rows:",
    db.execute(
        "SELECT COUNT(*) FROM sales s "  # => count the matches
        "JOIN products p ON s.code = p.code"
    ).fetchone()[0],
)  # => Output reads 4
