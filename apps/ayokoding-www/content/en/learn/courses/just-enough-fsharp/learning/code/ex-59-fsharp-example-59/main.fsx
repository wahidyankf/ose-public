// => A zero divisor is a normal rejected input.
let divide numerator denominator =
    // => Reject a zero divisor before doing integer division.
    if denominator = 0 then Error "division by zero"
    // => A nonzero divisor produces the quotient in Ok.
    else Ok(numerator / denominator)
// => The caller sees an Error case.
printfn "%A" (divide 9 0)
