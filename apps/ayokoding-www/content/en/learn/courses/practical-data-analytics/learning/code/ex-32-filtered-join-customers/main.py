# Worked Example 32: Joining With a Filter, Regulars Only
# => Sinar Abadi, its receipts, and its members list are fictional and fixed.
# => Two of four customers are members; the review counts their rows.
# => Join sales to customers, filter to members, then aggregate.
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
    "CREATE TABLE sales(order_id TEXT, customer TEXT, qty INT)"
)  # => receipts schema
db.executemany(
    "INSERT INTO sales VALUES(:order_id, :customer, :qty)", sales
)  # => load the rows
# => Load the committed customers fixture into its table.
with open(
    "customers.csv", newline="", encoding="utf-8"
) as handle:  # => fixed text settings
    customers = list(csv.DictReader(handle))  # => header becomes the keys
db.execute("CREATE TABLE customers(name TEXT, member INT)")  # => membership schema
db.executemany(
    "INSERT INTO customers VALUES(:name, :member)", customers
)  # => load the rows
# => Members only: the filter lives inside the query, not in a spreadsheet.
result = db.execute(
    "SELECT COUNT(*), SUM(s.qty) FROM sales s "  # => receipts and units
    "JOIN customers c ON s.customer = c.name "  # => match the buyer
    "WHERE c.member = 1"
).fetchone()  # => members drive the review
# => Show the member share of receipts and units side by side.
print("member_receipts:", result[0], "of", len(sales))  # => Output reads 3 of 5
print(
    "member_units:",
    result[1],
    "of",  # => Output reads 8 of 12
    sum(int(r["qty"]) for r in sales),
)  # => total units across all buyers
