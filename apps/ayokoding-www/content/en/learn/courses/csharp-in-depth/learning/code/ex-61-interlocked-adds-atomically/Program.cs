// => Example 61: Interlocked Adds Atomically.
// => Interlocked.Add sums without any lock: the hardware performs the add.
int total = 0; // => shared total: touched only through Interlocked below

// => 100 iterations add 370 each: no lock object, no critical section
Parallel.For(
    0,
    100,
    _ => // => discard: the index plays no role in the sum
    {
        // => atomic add: read-plus-write happens as one indivisible step
        Interlocked.Add(ref total, 370); // => 100 adds land exactly, never lost
    }
);

// => lock-free yet exact: 37000 on every machine, every run
Console.WriteLine($"total: {total}"); // => Output: total: 37000
