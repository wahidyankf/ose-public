// => The first value remains immutable.
let advanced =
    // => The first score is 7 inside the expression scope.
    let score = 7
    // => This inner binding shadows score without changing the first value.
    let score = score + 3
    // => Return the newly bound score, which is 10.
    score
// => The expression returns the latest binding.
printfn "%d" advanced
