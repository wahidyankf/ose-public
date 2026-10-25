// => Example 73: a tail-recursive sum read as base, shrink, accumulate.
let sumAcc xs = // => list in, total out, accumulator inside.
    // => Inner loop carries the running total: the accumulate role.
    let rec loop acc rest = // => accumulator plus remaining input.
        // => Base: empty answers the accumulator; the work is done.
        match rest with // => shrink the input every call.
        | [] -> acc // => base case: answer what accumulated.
        // => Shrink: head joins the total, tail recurs — input shortens.
        | h :: t -> loop (acc + h) t // => progress: strictly smaller rest.
    // => Start accumulating from zero over the whole list.
    loop 0 xs // => seed zero, shrink from here.
// => Two runs print: the sum and the empty-list base answering zero.
printfn "sum=%d empty=%d" (sumAcc [ 1; 2; 3; 4 ]) (sumAcc []) // => sum=10 empty=0.
