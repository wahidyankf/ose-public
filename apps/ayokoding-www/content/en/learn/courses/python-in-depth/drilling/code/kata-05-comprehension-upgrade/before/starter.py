# => Kata 5 starter: four lines for one transformation.
def big_squares(limit):  # => accumulator version of filter-plus-map
    out = []  # => empty result waiting to be filled
    for n in range(limit):  # => explicit loop over the range
        if n % 2 == 0:  # => condition separated from the result
            out.append(n * n)  # => method call per item
    return out  # => assembled elsewhere from parts


print(big_squares(8))  # => [0, 4, 16, 36]: correct but scattered
