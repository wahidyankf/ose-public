# => Fixture shim enforcing a per-task turn budget.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Turns are fixed data; no session runs here.
# => Real behaviour may differ; confirm with claude --help.
BUDGET = 5  # => five turns for this task, agreed up front


def run(tasks, budget):  # => execute tasks until work or budget runs out
    done = []  # => finished tasks collect here
    spent = 0  # => turns consumed so far
    for task in tasks:  # => walk the task list in order
        if spent >= budget:  # => the budget gate stops the run
            break  # => remaining tasks wait for a new budget
        done.append(task)  # => the task completes in one turn
        spent += 1  # => each task costs exactly one turn here
    return done, spent  # => work done plus the bill


def main():  # => run seven tasks against a budget of five
    tasks = ["t%d" % i for i in range(1, 8)]  # => seven tasks named t1 to t7
    done, spent = run(tasks, BUDGET)  # => five complete, two wait
    print("done:", len(done))  # => Output: done: 5
    print("spent:", spent)  # => Output: spent: 5


main()  # => run once; budgets turn sunk cost into a decision point
