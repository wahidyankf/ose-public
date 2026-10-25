# => Example 46: one stack implementation, every element type.
class Stack[T]:  # => WHY parameter: T threads through every method
    def __init__(self) -> None:  # => fresh empty storage per instance
        self._items: list[T] = []  # => WHY typed: the checker tracks T here

    def push(self, item: T) -> None:  # => T in: only matching items accepted
        self._items.append(item)  # => the single mutation point

    def pop(self) -> T:  # => T out: the pairing the checker enforces
        return self._items.pop()  # => LIFO: last pushed leaves first

    def __len__(self) -> int:  # => WHY dunder: len() works on stacks
        return len(self._items)  # => derived, never stored separately


ints: Stack[int] = Stack()  # => WHY annotate: this stack holds ints
ints.push(1)  # => accepted: int matches Stack[int]
ints.push(2)  # => second item stacked above the first
print(len(ints))  # => Output: 2, both items held
print(ints.pop())  # => Output: 2, LIFO order kept
