# => Fixture shim tallying turns per task.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Turn counts are fixed data; no session ran here.
# => Real behaviour may differ; confirm with claude --help.
TASKS = {"login fix": 3, "auth refactor": 9, "docs": 2}  # => turns spent per task


def total(tasks):  # => add every task's turns into the session bill
    return sum(tasks.values())  # => 14 turns for this session


def dearest(tasks):  # => name the task that cost the most turns
    return max(tasks, key=tasks.get)  # => auth refactor at 9 turns


def average(tasks):  # => mean turns per task, one decimal honesty
    return round(total(tasks) / len(tasks), 1)  # => 4.7 turns here


def main():  # => report total, dearest, and average
    print("total turns:", total(TASKS))  # => Output: total turns: 14
    print("dearest:", dearest(TASKS))  # => Output: dearest: auth refactor
    print("average:", average(TASKS))  # => Output: average: 4.7


main()  # => run once; measure before optimizing
