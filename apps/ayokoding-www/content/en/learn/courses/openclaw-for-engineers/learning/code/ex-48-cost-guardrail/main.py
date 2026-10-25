# => Three tasks; the third would cross the limit.
# => Approval gates the crossing, not the tasks.
LIMIT = 20000  # => session token limit demanding approval
# => twenty thousand tokens per session
tasks = [("triage", 6000), ("draft", 9000), ("research", 12000)]  # => task name plus fixture cost
# => tasks has 3 entries (type: list)
spent = 0  # => spent accumulates approved cost
for name, cost in tasks:  # => consider each task in order
    if spent + cost > LIMIT:  # => crossing the limit needs a human
        print(name + ": needs approval at %d" % (spent + cost))  # => Output: research: needs approval at 27000
        approved = True  # => fixture: the human approves the crossing
        # => approval is explicit
        print("approved crossing: " + str(approved))  # => Output: approved crossing: True
    spent += cost  # => approved cost joins the spend
    # => spent reaches 27000
    print(name + " spent, total %d" % spent)  # => Output: three spend lines
print("limit: %d spent: %d" % (LIMIT, spent))  # => Output: limit: 20000 spent: 27000
