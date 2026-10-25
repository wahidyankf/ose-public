# Worked Example 26: Correlation and Its Limits
# => Sinar Abadi and its weekly numbers are fictional; every cell is fixed.
# => Ad spend and revenue march together; payday weeks lift them both.
# => statistics.correlation measures the march, words state the limit.
import statistics

# => Eight weeks of ad spend in thousands, fixed for the lesson.
spend = [10, 12, 11, 15, 14, 18, 17, 20]  # => the suspected driver
# => Eight weeks of revenue in millions, fixed for the lesson.
revenue = [21, 25, 23, 31, 29, 37, 35, 40]  # => the hoped-for effect
# => Pearson correlation: co-movement on a scale of minus one to one.
r = statistics.correlation(spend, revenue)  # => near-perfect co-movement
print("correlation:", round(r, 4))  # => Output reads above 0.98
# => The number cannot name the payday calendar lifting both series.
print(
    "caveat: payday weeks lift spend and revenue together;"
)  # => Output states the confounder
print("cause not shown by correlation alone.")  # => Output refuses the causal claim
