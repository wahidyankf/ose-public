// => Both functions accept and return int.
let double value = value * 2
// => The second function adds one after doubling.
let addOne value = value + 1
// => >> applies double, then addOne.
let transform = double >> addOne
// => Transforming 3 produces 7.
printfn "%d" (transform 3)
