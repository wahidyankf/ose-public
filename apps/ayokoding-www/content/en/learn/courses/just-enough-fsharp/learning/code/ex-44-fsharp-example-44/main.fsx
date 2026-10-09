// => Add contains two Expr children.
type Expr = Number of int | Add of Expr * Expr
// => The expression is a tree, not a computed answer yet.
let expression = Add(Number 2, Number 3)
// => The printed shape shows both child nodes.
printfn "%A" expression
