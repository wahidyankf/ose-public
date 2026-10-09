// => rec makes the function name available in its own body.
let rec factorial n =
    // => The base case stops recursion at zero or one.
    if n <= 1 then 1
    // => Multiply by the factorial of the smaller input.
    else n * factorial (n - 1)
// => The result for 5 is 120.
printfn "%d" (factorial 5)
