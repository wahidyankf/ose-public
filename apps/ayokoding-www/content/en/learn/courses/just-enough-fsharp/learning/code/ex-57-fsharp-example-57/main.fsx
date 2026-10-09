// => This script-level dictionary is shared by calls to fib.
let cache = System.Collections.Generic.Dictionary<int, int>()
// => The recursive function first handles a base case or cache lookup.
let rec fib n =
    // => Zero and one are returned without further calls.
    if n < 2 then n
    // => Only inputs above one reach the cache branch.
    else
        // => TryGetValue reports whether this n was already calculated.
        match cache.TryGetValue n with
        // => A cache hit returns the stored integer immediately.
        | true, value -> value
        // => A miss requires two smaller Fibonacci values.
        | false, _ ->
            // => Add the two recursive answers for the missing input.
            let value = fib (n - 1) + fib (n - 2)
            // => Save this result so repeated subproblems avoid recomputation.
            cache.[n] <- value
            // => Return the newly stored value to the caller.
            value
// => This prints 55.
printfn "%d" (fib 10)
