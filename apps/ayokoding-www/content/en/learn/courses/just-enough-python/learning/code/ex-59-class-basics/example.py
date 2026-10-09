"""Example 59: Class Basics."""

# => Moving by (3, 4) changes the point to (4, 6).


class Point:  # => defines a new class named Point
    # Runs automatically on Point(...) -- the constructor.
    def __init__(self, x: int, y: int) -> None:  # => starts at (1, 2) below
        self.x = x  # => stores x as an instance attribute
        self.y = y  # => stores y as an instance attribute

    # self is the instance the method was called on; this mutates it in place.
    def move(self, dx: int, dy: int) -> None:  # => deltas are (3, 4) below
        self.x += dx  # => adds dx to the instance's current x
        self.y += dy  # => adds dy to the instance's current y


p = Point(1, 2)  # => calls __init__(p, 1, 2) under the hood
p.move(3, 4)  # => mutates p.x and p.y in place
print(p.x, p.y)  # => 1+3=4, 2+4=6 -- Output: 4 6
