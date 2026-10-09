"""Example 60: Class __repr__."""

# => The representation includes both stored coordinate names and values.


class Point:  # => defines a new class named Point
    # The constructor, called automatically by Point(x, y).
    def __init__(self, x: int, y: int) -> None:  # => stores coordinates 1, 2 below
        self.x = x  # => stores x as an instance attribute
        self.y = y  # => stores y as an instance attribute

    # print() and the REPL both call __repr__ automatically.
    def __repr__(self) -> str:  # => defines the string shown by print() and the REPL
        return f"Point(x={self.x}, y={self.y})"  # => builds a readable representation


print(Point(1, 2))  # => Output: Point(x=1, y=2)
