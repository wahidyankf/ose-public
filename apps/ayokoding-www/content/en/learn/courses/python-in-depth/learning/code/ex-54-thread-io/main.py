# => Example 54: waits overlap; joins order the results.
import threading  # => WHY threads: I/O waits, never CPU work
import time  # => sleep stands in for network and disk waits

results = [None, None, None]  # => WHY slots: preassigned positions order output


def fetch(slot, name):  # => one worker: wait, then record
    time.sleep(0.01)  # => the I/O-shaped wait: GIL released here
    results[slot] = name  # => WHY slot: position fixed, no print races


workers = []  # => handles every thread for joining
for slot, name in enumerate(["a", "b", "c"]):  # => three fixed workers
    worker = threading.Thread(target=fetch, args=(slot, name))  # => work assigned
    workers.append(worker)  # => tracked for the join below
    worker.start()  # => WHY start: waits now overlap
for worker in workers:  # => WHY join: completion before reading
    worker.join()  # => every thread finished from here on
print(results)  # => Output: ['a', 'b', 'c'], order guaranteed
