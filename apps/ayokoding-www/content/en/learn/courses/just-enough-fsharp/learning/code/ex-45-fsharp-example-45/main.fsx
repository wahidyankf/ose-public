// => The recursive union defines leaf and branch nodes.
type Expr = Number of int | Add of Expr * Expr
// => Every case returns an int.
let rec evaluate expression =
    // => Inspect whether the node is a leaf or an addition branch.
    match expression with
    // => A Number leaf evaluates to its stored integer.
    | Number value -> value
    // => Evaluate both children before adding their answers.
    | Add(left, right) -> evaluate left + evaluate right
// => The nested expression evaluates to 6.
printfn "%d" (evaluate (Add(Number 1, Add(Number 2, Number 3))))
