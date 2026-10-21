# => Example 59: deadlines turn hangs into handled errors.
import asyncio  # => WHY timeout: bounded waits from the stdlib


async def slow():  # => a coroutine slower than its budget
    await asyncio.sleep(10)  # => far beyond any sane deadline
    return "late"  # => unreachable under the timeout below


async def quick():  # => a coroutine comfortably inside budget
    await asyncio.sleep(0.001)  # => tiny simulated wait
    return "early"  # => arrives before the deadline


async def main():  # => both outcomes demonstrated in order
    print(await asyncio.wait_for(quick(), timeout=5))  # => Output: early, within budget
    try:  # => WHY try: expiry is an expected outcome here
        await asyncio.wait_for(slow(), timeout=0.05)  # => deadline beats the work
    except TimeoutError:  # => the bounded failure, handled plainly
        print("timed out as designed")  # => Output: timed out as designed


asyncio.run(main())  # => WHY run: one loop owns the whole demo
