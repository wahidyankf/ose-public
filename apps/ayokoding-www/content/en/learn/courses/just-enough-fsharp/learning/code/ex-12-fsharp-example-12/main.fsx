// => [] is the empty list.
let tail = [2; 3]
// => :: adds 1 at the front without changing tail.
let values = 1 :: tail
// => This prints [1; 2; 3].
printfn "%A" values
