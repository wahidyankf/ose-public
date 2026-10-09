"""Example 12: f-string Formatting."""
# => Two decimal places round 3.14159 to 3.14.

pi: float = 3.14159  # => pi starts as a float with five decimal places
# :.2f is a format spec -- fixed-point, 2 digits after the decimal.
print(f"{pi:.2f}")  # => Output: 3.14
