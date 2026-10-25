# => Example 56: the queue owns all coordination.
import queue  # => WHY queue: atomic handoff plus completion tracking
import threading  # => one consumer thread for the demo

pipe = queue.Queue()  # => the channel between producer and consumer
done = []  # => collected results, appended by the single consumer


def consume():  # => the consumer: drains until the sentinel
    while True:  # => loop ends only on the terminator
        item = pipe.get()  # => WHY blocking: sleeps until work arrives
        if item is None:  # => WHY sentinel: the agreed end of stream
            pipe.task_done()  # => count the sentinel too
            return  # => clean exit: no flags needed
        done.append(item * 10)  # => the stage work, single-threaded here
        pipe.task_done()  # => WHY done: join tracks every item


worker = threading.Thread(target=consume)  # => the consumer thread
worker.start()  # => waiting on the empty pipe
for n in [1, 2, 3, 4, 5]:  # => the producer: five fixed items
    pipe.put(n)  # => enqueue in order
pipe.put(None)  # => WHY sentinel: one terminator for one consumer
pipe.join()  # => WHY join: all items plus sentinel processed
worker.join()  # => consumer exited after the sentinel
print(done)  # => Output: [10, 20, 30, 40, 50], each exactly once
