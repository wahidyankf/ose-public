# => Example 60: CPU work scales across processes.
from concurrent.futures import ProcessPoolExecutor  # => WHY processes: past the GIL


def square(n):  # => WHY pure: picklable, no shared state needed
    return n * n  # => compute-only: the process-friendly shape


def main():  # => WHY main: spawned workers re-import this module
    with ProcessPoolExecutor() as pool:  # => one real core per worker
        return list(pool.map(square, [1, 2, 3, 4]))  # => WHY map: order kept


if __name__ == "__main__":  # => WHY guard: workers must not re-execute
    print(main())  # => Output: [1, 4, 9, 16], side by side yet ordered
