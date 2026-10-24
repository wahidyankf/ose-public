# => Kata 5 solution: the mapping as one expression.
def big_squares(limit):  # => the same contract, one expression
    return [
        n * n for n in range(limit) if n % 2 == 0
    ]  # => WHY one line: map plus filter


print(big_squares(8))  # => Output: [0, 4, 16, 36], identical result
print(big_squares(0))  # => Output: [], empty input stays clean
print(len(big_squares(100)))  # => Output: 50, half of one hundred kept
