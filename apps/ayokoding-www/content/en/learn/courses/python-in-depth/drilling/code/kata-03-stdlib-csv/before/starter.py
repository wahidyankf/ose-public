# => Kata 3 starter: split breaks on the quoted comma.
def parse_line(line):  # => naive split on every comma
    return line.strip().split(",")  # => quoted commas split too: the bug


print(parse_line("ada,98"))  # => ['ada', '98']: clean rows work
print(parse_line('"grace, r.",100'))  # => 3 pieces: the quoted comma split
