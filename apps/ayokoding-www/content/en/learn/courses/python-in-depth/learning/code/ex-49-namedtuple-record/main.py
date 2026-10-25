# => Example 49: named fields over tuple efficiency.
from collections import namedtuple  # => WHY namedtuple: names plus tuple speed

Point = namedtuple("Point", ["x", "y"])  # => the record shape, named once
p = Point(3, 4)  # => construction stays positional and brief
print(p.x)  # => Output: 3, named access documents intent
print(p[1])  # => Output: 4, indexing still works generically
x, y = p  # => WHY unpack: generic code destructures freely
print(x + y)  # => Output: 7, parts reused plainly
moved = p._replace(x=0)  # => WHY replace: evolution without mutation
print(moved)  # => Output: Point(x=0, y=4), new instance made
print(p)  # => Output: Point(x=3, y=4), original untouched
