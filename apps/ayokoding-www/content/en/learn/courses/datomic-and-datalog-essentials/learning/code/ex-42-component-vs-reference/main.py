# Worked Example 42: Owned Parts Versus Shared Customers
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Cancelling order 10 removes two lines and zero customers.
# => Components cascade; references survive.
schema = {"order/line": "component"}  # => owned lines
# => The customer slot joins the ownership map.
schema["order/customer"] = "reference"  # => shared customers
# => Order 10 owns two lines and references customer 20.
db = ["line-10-a", "line-10-b"]  # => the owned components
# => Deleting the order cascades through components only.
cascaded = list(db) if schema["order/line"] == "component" else []  # => both lines go
# => Compute the next value.
kept = schema["order/customer"] == "reference"  # => references survive
# => Cancelled orders keep their customers.
survived = [20] if kept else []  # => the customer stays
# => Print the cascade result.
print("deleted-lines:", len(cascaded))  # => Output shows 2
# => The check the lesson quotes.
print("surviving-customers:", survived)  # => Output shows 20
