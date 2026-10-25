# => Kata reference: first five tasks run, the rest wait.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Tasks are fixed data; nothing is scheduled here.
TASKS = ["fix", "test", "docs", "refactor", "deploy", "notify", "log"]  # => seven tasks
BUDGET = 5  # => five turns available


def budget(tasks, cap):  # => the first cap tasks run now
    return list(tasks[:cap])  # => fix through deploy run now


def waiting(tasks, cap):  # => the remainder waits for a new budget
    return list(tasks[cap:])  # => notify and log wait


def main():  # => budget seven tasks against five turns
    print("now:", budget(TASKS, BUDGET))  # => Output: now: the first five tasks
    print("waiting:", waiting(TASKS, BUDGET))  # => Output: waiting: ['notify', 'log']


main()  # => run once; compare your starter against this budget
