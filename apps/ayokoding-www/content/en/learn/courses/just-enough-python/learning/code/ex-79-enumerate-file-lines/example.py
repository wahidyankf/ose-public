"""Example 79: Enumerate File Lines."""

# => File lines retain their own newline when printed.

with open("notes.txt") as f:  # => opens the file for reading (default mode "r")
    # start=1 -- files are usually numbered from line 1, not line 0.
    # enumerate() pairs each element with a running index, starting at 1 here.
    for line_number, line in enumerate(f, 1):  # => first line number is 1
        print(f"{line_number}: {line}", end="")  # => no extra newline
