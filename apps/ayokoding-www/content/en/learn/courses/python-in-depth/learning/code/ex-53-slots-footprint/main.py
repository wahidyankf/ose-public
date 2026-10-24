# => Example 53: fixed layout halves per-object memory.
# => Hot fixed shapes earn slots: half the memory per object.
# => Behavior identical: optimization must never change answers.
import sys  # => WHY sys: getsizeof measures the saving


class Row:  # => the baseline: every instance carries a dict
    def __init__(self, a, b):  # => two fields assigned per instance
        self.a = a  # => stored in the instance dict
        self.b = b  # => second dict entry per object


class SlotRow:  # => the optimized twin: fixed fields declared
    __slots__ = ("a", "b")  # => WHY slots: array layout, no dict

    def __init__(self, a, b):  # => same construction contract
        self.a = a  # => stored in the fixed layout
        self.b = b  # => second slot beside the first


plain = Row(1, 2)  # => baseline instance for measuring
narrow = SlotRow(1, 2)  # => slotted instance holding the same data
print(hasattr(plain, "__dict__"))  # => Output: True, baseline carries a dict
print(hasattr(narrow, "__dict__"))  # => Output: False, slots removed the dict
total_plain = sys.getsizeof(plain) + sys.getsizeof(
    plain.__dict__
)  # => WHY total: dict included
print(sys.getsizeof(narrow) < total_plain)  # => Output: True, layout wins
print(narrow.a + narrow.b)  # => Output: 3, behavior identical
