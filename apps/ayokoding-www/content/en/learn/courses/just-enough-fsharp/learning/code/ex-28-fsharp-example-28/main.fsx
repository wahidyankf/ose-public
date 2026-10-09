// => The inner loop carries the total forward.
let sumTo n =
    // => The inner loop carries the next number and current sum.
    let rec loop current total =
        // => Return the sum once the next number exceeds n.
        if current > n then total
        // => Advance the number and include it in the new sum.
        else loop (current + 1) (total + current)
    // => Start counting at one with a zero total.
    loop 1 0
// => Summing 1 through 4 gives 10.
printfn "%d" (sumTo 4)
