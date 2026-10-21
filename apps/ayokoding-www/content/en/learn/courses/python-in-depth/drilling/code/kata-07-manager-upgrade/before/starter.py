# => Kata 7 starter: the pairing spans the whole body.
log = []  # => stand-in for an acquired resource


def work():  # => manual acquire plus release
    log.append("acquire")  # => setup inline with the logic
    try:  # => body plus cleanup interleaved
        log.append("work")  # => the actual work, one line here
    finally:  # => release must be remembered on every path
        log.append("release")  # => paired by discipline, not structure


work()  # => run the paired region
print(log)  # => ['acquire', 'work', 'release']: correct by care
