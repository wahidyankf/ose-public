# => Example 58: one thread, three overlapping waits.
# => Gather preserves order: concurrency without transcript chaos.
# => One loop owns the demo: asyncio.run opens and closes it.
import asyncio  # => WHY asyncio: thousands of waits, one thread


async def fetch(name, delay):  # => a coroutine: runs until await
    await asyncio.sleep(delay)  # => WHY await: the loop parks here
    return name  # => result ready after the simulated wait


async def main():  # => the entry coroutine gather drives
    return await asyncio.gather(
        fetch("a", 0.01), fetch("b", 0.01), fetch("c", 0.01)
    )  # => WHY gather: ordered join


print(asyncio.run(main()))  # => Output: ['a', 'b', 'c'], overlapped yet ordered
