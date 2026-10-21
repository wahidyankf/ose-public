# => Example 61: sharing versus copying, demonstrated.
import multiprocessing  # => WHY processes: the copying model for contrast
import threading  # => WHY threads: the sharing model first

flag = []  # => shared list: threads see every mutation


def set_flag():  # => the thread worker: mutates shared state
    flag.append("set")  # => visible to the spawner immediately


def child(items):  # => the process worker: receives a copy
    items.append("child")  # => mutates only the child copy


def main():  # => WHY main: spawn-safe entry for both models
    worker = threading.Thread(target=set_flag)  # => shares the process memory
    worker.start()  # => runs against the same list object
    worker.join()  # => finished: the mutation landed
    print(flag)  # => Output: ['set'], threads share everything
    items = ["parent"]  # => the list handed across the process boundary
    proc = multiprocessing.Process(target=child, args=(items,))  # => copy, not share
    proc.start()  # => child runs against its own copy
    proc.join()  # => finished: parent list untouched
    print(items)  # => Output: ['parent'], processes copy memory


if __name__ == "__main__":  # => WHY guard: workers re-import this module
    main()  # => single entry point for every start method
