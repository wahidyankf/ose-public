// => fun introduces an unnamed function.
let square = fun value -> value * value
// => The function can still be bound and reused.
let result = square 4
// => This prints 16.
printfn "%d" result
