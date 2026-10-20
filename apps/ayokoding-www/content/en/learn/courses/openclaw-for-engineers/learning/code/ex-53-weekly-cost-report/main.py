# => Five daily spends aggregated against one budget.
# => Reporting early keeps the budget boring.
daily = [4200, 5100, 9800, 3900, 4600]  # => fixture tokens per workday
# => daily has 5 entries (type: list)
BUDGET = 30000  # => the team's weekly token budget
# => thirty thousand tokens per week
spent = sum(daily)  # => add the five days for the week total
# => spent is 27600
print("days: %d spent: %d" % (len(daily), spent))  # => Output: days: 5 spent: 27600
print("budget: %d" % BUDGET)  # => Output: budget: 30000
left = BUDGET - spent  # => remaining headroom for the week
# => left is 2400
print("headroom: %d" % left)  # => Output: headroom: 2400
print("within budget: " + str(spent <= BUDGET))  # => Output: within budget: True
