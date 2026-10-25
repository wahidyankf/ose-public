// => Example 57: Lock Guards Total.
// => Parallel threads add under one lock: the total lands exactly every run.
object gate = new(); // => target-typed new: the lock object itself
int total = 0; // => shared total: touched only inside the lock below

// => Parallel.For splits 100 adds across threads: the lock serializes them
Parallel.For(
    0,
    100,
    i => // => i runs 0 to 99 on whatever threads come
    {
        // => lock admits one thread: the add below never interleaves
        lock (gate) // => every iteration waits its turn on the same gate
        {
            total += 370; // => 100 adds of 370: the sum cannot drift
        }
    }
);

// => the guarded sum is exact: 37000 on every machine, every run
Console.WriteLine($"total: {total}"); // => Output: total: 37000
