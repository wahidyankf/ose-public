# => Example 63: the contract lives above the code.
# => Summary first: help readers decide in one line.
# => Args name constraints: units and ranges where ambiguity lives.
# => Raises completes the promise: callers handle what is documented.
# => A complete docstring answers four questions: what, with what, what back, what if bad.
# => Callers read the docstring; maintainers read the body; both stay in sync.
# => Review the promise in every behavior diff so the contract never rots.


def clamp(value, low, high):  # => the documented contract below
    """Clamp value into the closed range [low, high].

    Args: value is the candidate number; low and high bound it, low <= high.
    Returns the clamped number. Raises ValueError when low exceeds high.
    """
    if low > high:  # => WHY guard: the documented rejection first
        raise ValueError("low must not exceed high")  # => typed per the contract
    return max(low, min(value, high))  # => WHY clamp: lower bound then upper


print(
    clamp.__doc__.splitlines()[0]
)  # => Output: Clamp value into the closed range [low, high].
print(clamp(5, 0, 10))  # => Output: 5, inside passes through
print(clamp(-5, 0, 10))  # => Output: 0, below clamps up
print(clamp(99, 0, 10))  # => Output: 10, above clamps down
