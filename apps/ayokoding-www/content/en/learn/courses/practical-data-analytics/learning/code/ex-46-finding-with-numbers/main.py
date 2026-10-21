# Worked Example 46: Findings With Numbers and Uncertainty
# => Sinar Abadi and its September rice sales are fictional and fixed.
# => Four receipts carry the claim; the sentence must admit it.
# => Center, spread, and n formatted into one honest finding.
import statistics

# => September rice baskets in units, fixed for the lesson.
baskets = [2, 4, 3, 3]  # => four receipts, no more
# => The trio: balancing point, wobble, and weight of evidence.
center = round(statistics.mean(baskets), 2)  # => the headline number
spread = round(statistics.stdev(baskets), 2)  # => the honest wobble
# => Print the finding the way the course requires it, all three together.
print(
    f"rice averages {center} units per September receipt "  # => Output states the center
    f"(stdev {spread}, n={len(baskets)})."
)  # => Output attaches spread and count
