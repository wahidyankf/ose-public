# => Example 27: the guard separates library from program.
import sys  # => argv arrives from the real command line


def greet(name):  # => WHY above guard: import-safe definition
    return f"hello, {name}"  # => pure: testable without running anything


def main(argv):  # => WHY main: the CLI path as a callable function
    who = argv[1] if len(argv) > 1 else "world"  # => default keeps bare runs working
    print(greet(who))  # => orchestration: parse, call, print
    return 0  # => WHY return: exit status as data, raised once below


if __name__ == "__main__":  # => WHY guard: script action only when executed
    raise SystemExit(main(sys.argv))  # => single exit point for the program
