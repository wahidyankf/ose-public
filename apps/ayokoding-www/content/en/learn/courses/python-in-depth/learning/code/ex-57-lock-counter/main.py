# => Example 57: the lock serializes read-modify-write.
import threading  # => threads plus the mutual-exclusion lock

counter = 0  # => shared mutable state: the race lives here
guard = threading.Lock()  # => WHY lock: one holder at a time


def bump():  # => the critical section: read, add, write
    global counter  # => WHY global: the shared cell assigned here
    with guard:  # => WHY narrow: only the increment is atomic
        counter += 1  # => serialized: no update can be lost


workers = [threading.Thread(target=bump) for _ in range(10)]  # => ten racers
for worker in workers:  # => start every contender
    worker.start()  # => interleaving attempted here
for worker in workers:  # => join before reading the total
    worker.join()  # => all increments landed
print(counter)  # => Output: 10, serialized increments all kept
