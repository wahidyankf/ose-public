"""Example 15: Linear Search -- Value Found."""


# Scans items left to right until target is found -- O(n) worst case (co-13).
def linear_search(items: list[int], target: int) -> int:  # => a plain function
    for index, value in enumerate(items):  # => checks each element in order
        if value == target:  # => no ordering clue lets this one-off search skip values
            return index  # => returns immediately -- best case can be O(1)
    return -1  # => reached only if every element was checked and none matched


numbers = [8, 3, 5, 1, 9, 2]  # => unsorted list, with no prepared search index
found_index = linear_search(numbers, 9)  # => 9 sits at index 4
print(found_index)  # => Output: 4

assert found_index == 4  # => confirms the returned index matches numbers[4]
assert numbers[found_index] == 9  # => confirms indexing back in recovers the target
print("ex-15 OK")  # => Output: ex-15 OK
