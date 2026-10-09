"""Example 62: argparse Optional store_true Flag."""

# store_true flags don't take a value -- their mere presence sets the attribute True.
import argparse  # => imports the standard-library CLI-parsing module


def main() -> None:  # => defines the entry point, called only when run directly
    parser = argparse.ArgumentParser(description="Greet someone by name.")
    # => creates the parser; description appears in the auto-generated --help text
    parser.add_argument("name", type=str, help="the name to greet")
    # => a required positional argument, same as Example 61
    parser.add_argument(
        "--upper",  # => the flag's name -- accessed later as args.upper
        action="store_true",  # => present -> True, absent -> False; no value needed
        help="uppercase the greeting",  # => shown in --help output
    )  # => finishes defining the optional flag
    args = parser.parse_args()  # => parses sys.argv, matching --upper if present
    message = f"Hello, {args.name}"  # => the base greeting, before any uppercasing
    print(message.upper() if args.upper else message)  # => branches on the flag


if __name__ == "__main__":  # => True only when cli.py is run directly, not imported
    main()  # => calls main(), which builds the parser and prints the greeting
# => Run: python3 cli.py Ada --upper -- Output: HELLO, ADA
