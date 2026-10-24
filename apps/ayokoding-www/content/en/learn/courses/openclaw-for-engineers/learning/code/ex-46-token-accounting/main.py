# => Four turns with fixture token counts.
# => Accumulation turns counts into spend.
turns = [1200, 3400, 9800, 2100]  # => tokens per turn, turn three spikes
# => turns has 4 entries (type: list)
running = 0  # => running accumulates spend turn by turn
for i, tokens in enumerate(turns, start=1):  # => ledger each turn in order
    running += tokens  # => add this turn's tokens to the spend
    # => running reaches 16500 by turn four
    print("turn %d: %d tokens, running %d" % (i, tokens, running))  # => Output: four ledger lines
print("session total: %d" % running)  # => Output: session total: 16500
worst = turns.index(max(turns)) + 1  # => find the costliest turn, numbered from 1
# => worst is turn 3
print("costliest turn: %d" % worst)  # => Output: costliest turn: 3
