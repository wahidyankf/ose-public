# => Kata starter: require the test context before merging.
# => Fill PROTECTION so test gates the merge, then check it.
PROTECTION = {"required": []}  # => TODO: require the test context
CHECK = "test"  # => the job name protection must name


def gates(protection, check):  # => TODO: True when check is required
    return False  # => TODO: membership test on required
