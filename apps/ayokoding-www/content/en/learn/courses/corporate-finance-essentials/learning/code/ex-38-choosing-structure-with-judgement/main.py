# Worked Example 38: Choosing a Structure With Judgement
# => Merpati Trading Co. is fictional; every number here is fixed.
# => No formula picks the structure; three scored tests frame the choice.
# => EPS rewards leverage, coverage punishes it, flexibility insures it.
from decimal import Decimal

# => The two structures' EPS, coverage, and covenant headroom.
eps_a = Decimal("2.34")  # => levered EPS from Example 35
eps_b = Decimal("1.80")  # => diluted EPS from Example 35
coverage_a = Decimal("180000") / Decimal("24000")  # => 7.50 times
coverage_b = Decimal("180000") / Decimal("12000")  # => 15.00 times
# => Test one: which structure pays owners more per share?
eps_winner = "A" if eps_a > eps_b else "B"  # => leverage wins good years
# => Test two: which structure survives a halved EBIT above 3.00 cover?
survives_a = coverage_a / Decimal("2") >= Decimal("3")  # => 3.75 holds
survives_b = coverage_b / Decimal("2") >= Decimal("3")  # => 7.50 holds easily
# => Test three: which keeps more covenant headroom for the next van?
room_a = Decimal("477142.86")  # => Example 36 headroom under A
room_b = room_a + Decimal("200000")  # => repaid debt returns as room
# => A pays more today; B bends further before it breaks.
print("eps-winner:", eps_a, eps_b, eps_winner)  # => Output the paying test
print("survives-halved-ebit:", survives_a, survives_b)  # => Output the stress test
print("headroom-b-minus-a:", room_b - room_a)  # => Output the flexibility gap
