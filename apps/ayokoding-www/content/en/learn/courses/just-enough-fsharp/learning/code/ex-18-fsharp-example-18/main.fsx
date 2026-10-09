// => Each case may carry its own data.
type Shape = Circle of float | Rectangle of float * float
// => Construct the Circle case with its radius.
let shape = Circle 2.0
// => %A prints the case and payload.
printfn "%A" shape
