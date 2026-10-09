// => The compiler infers a generic input list.
let countItems items = List.length items
// => Both calls reuse the same function.
let words = countItems ["red"; "blue"]
// => The same generic function also counts integer items.
let numbers = countItems [1; 2; 3]
// => This prints 2, 3.
printfn "%d, %d" words numbers
