# => Offline needs-graph validator for the validate-needs-graph workflow file.
# => Checked against the vendor jobs.<id>.needs docs on 2026-10-20.
# => EDGES mirrors every needs entry in workflow.yaml.
# => No network and no live repository; sorting is pure logic.
# => WHY sort offline: a cycle fails the run before it starts.
# => Kahn pass with sorted queues keeps the order deterministic.
EDGES = {
    "lint": [],
    "test": ["lint"],
    "deploy": ["lint", "test"],
}  # => job to list of jobs it waits for


def order():  # => topological order, cycle raises loudly
    waiting = {j: set(d) for j, d in EDGES.items()}  # => remaining deps
    done = []  # => finished jobs in run order
    while waiting:  # => drain every job with no open deps
        ready = sorted(j for j, d in waiting.items() if not d)  # => free jobs
        assert ready, "cycle in needs graph: " + ",".join(sorted(waiting))  # => noose
        take = ready[0]  # => alphabetical first keeps it stable
        done.append(take)  # => this job runs now
        del waiting[take]  # => remove it from the graph
        for deps in waiting.values():  # => unblock its followers
            deps.discard(take)  # => one fewer reason to wait
    return done  # => safe execution order


def main():  # => print the order plus the dependency count
    seq = order()  # => raises on a cycle, prints otherwise
    for i, job in enumerate(seq, 1):  # => numbered, stable order
        print("step" + str(i) + ":", job)  # => Output: run position
    total = sum(len(d) for d in EDGES.values())  # => edge count
    print("jobs:", len(seq), "edges:", total)  # => graph summary


main()  # => run once; a cycle fails the assert, never the cluster
