# => Kata 8 solution: events on stderr, data on stdout.
import io  # => WHY capture: the transcript pins the record bytes
import logging  # => WHY logging: levels plus routing

stream = io.StringIO()  # => handler target for the demonstration
handler = logging.StreamHandler(stream)  # => diagnostics flow here
handler.setFormatter(
    logging.Formatter("%(levelname)s %(message)s")
)  # => WHY fixed: stable shape
log = logging.getLogger("kata8")  # => WHY named: records carry origin
log.addHandler(handler)  # => the single configured route
log.setLevel(logging.INFO)  # => gate set once at the boundary


def total(items):  # => the same function, quiet on stdout
    log.info("computing")  # => event, not print: routable and gatible
    return sum(items)  # => result returns; diagnostics stay aside


print(total([1, 2]))  # => Output: 3, stdout carries data only
print(repr(stream.getvalue()))  # => Output: 'INFO computing\n', events aside
