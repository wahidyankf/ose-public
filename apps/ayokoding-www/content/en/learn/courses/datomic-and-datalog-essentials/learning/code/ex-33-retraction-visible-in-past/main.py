# Worked Example 33: Deleted Now, Visible Then
# => Kencana Parts Co. is fictional; every number here is fixed.
# => One retraction, two eras, two correct answers.
# => Retractions close visibility from their transaction onward.
db = [(1, "part/color", "red", 30601)]  # => asserted in March
# => Red is discontinued in April.
retracted_at = 30602  # => visibility ends here


# => The color as of T: asserted before T, not yet retracted at T.
def color_as_of(target):  # => era-aware color read
    # => Facts visible at the target predate the retraction.
    visible = [
        v for _e, _a, v, t in db if t <= target < retracted_at
    ]  # => the visibility window
    # => Hand the answer back.
    return visible  # => red then, nothing now


# => Print March, then the present.
print("march-color:", color_as_of(30601))  # => Output shows red
# => The check the lesson quotes.
print("now-color:", color_as_of(30699))  # => Output shows empty
