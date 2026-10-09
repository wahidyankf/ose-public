// => add is a two-argument curried function.
let add left right = left + right
// => Fix the first argument and keep the second open.
let addTax = add 10
// => Applying the remaining argument yields 35.
printfn "%d" (addTax 25)
