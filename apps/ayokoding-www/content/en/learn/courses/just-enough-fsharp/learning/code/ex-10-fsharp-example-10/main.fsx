// => A comma creates a two-item tuple.
let location = (3, 8)
// => Pattern binding extracts each position.
let x, y = location
// => This prints 3, 8.
printfn "%d, %d" x y
