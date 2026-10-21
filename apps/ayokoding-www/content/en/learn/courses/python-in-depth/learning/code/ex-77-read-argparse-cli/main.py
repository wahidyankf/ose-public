# => Example 77: parser declares, namespace carries, dispatch calls.
# => Limits slice results: parsing plus presentation compose.
# => Bare runs demonstrate defaults: the transcript shows both paths.
# => Explicit argv overrides cleanly: flags replace defaults per run.
# => Prog names the tool: usage reads as documentation.
# => Defaults keep bare runs working: common case needs no flags.
# => Type callables validate at parse: bad input fails with usage.
# => Namespaces carry parsed state: dispatch reads attributes.
# => Testable parsers: builders return tables tests can inspect.
import argparse  # => WHY argparse: the standard CLI shape


def build_parser():  # => WHY function: parsers are testable units
    parser = argparse.ArgumentParser(
        prog="counter", description="Count lines."
    )  # => the declaration
    parser.add_argument(
        "words", nargs="*", default=["a", "b", "c"]
    )  # => WHY default: bare runs work
    parser.add_argument(
        "--limit", type=int, default=10
    )  # => WHY type: validated at parse
    return parser  # => the table, ready for any argv


namespace = build_parser().parse_args([])  # => WHY empty: defaults demonstrated
print(namespace.words)  # => Output: ['a', 'b', 'c'], defaults filled in
print(namespace.limit)  # => Output: 10, option default applied
chosen = build_parser().parse_args(
    ["x", "y", "--limit", "2"]
)  # => explicit argv parsed
print(chosen.words[: chosen.limit])  # => Output: ['x', 'y'], limit slices
