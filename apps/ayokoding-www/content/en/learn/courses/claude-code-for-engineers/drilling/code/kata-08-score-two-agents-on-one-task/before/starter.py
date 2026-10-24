# => Kata starter: score both agents on the rubric below.
# => Run the reference solution to see the target verdict.
RUBRIC = {"correct": 50, "scope": 20, "turns": 20, "safe": 10}  # => frozen weights
A = {"correct": 50, "scope": 20, "turns": 12, "safe": 10}  # => this tool
B = {"correct": 0, "scope": 14, "turns": 16, "safe": 10}  # => the peer stumbled


def score(row, rubric):  # => TODO: total one side under frozen weights
    return 0  # => TODO: replace with the real total
