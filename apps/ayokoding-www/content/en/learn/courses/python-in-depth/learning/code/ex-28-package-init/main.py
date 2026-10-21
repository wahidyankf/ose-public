# => Example 28 driver: the package used through its surface.
from shapes import circle_area, square_area  # => WHY surface: no deep reaches

print(circle_area(1.0) > 3.14)  # => Output: True, pi times one squared
print(square_area(2.0))  # => Output: 4.0, two squared
print(circle_area(1.0) < square_area(2.0))  # => Output: True, shapes compared
