// => The expression has literal, addition, and division cases.
type Expr = Number of int | Add of Expr * Expr | Divide of Expr * Expr
// => The match handles every case and propagates errors.
let rec evaluate expression =
    // => Inspect the expression’s union case.
    match expression with
    // => A Number leaf succeeds with its stored integer.
    | Number value -> Ok value
    // => Add has two child expressions to evaluate.
    | Add(left, right) ->
        // => Compute both child results before combining them.
        match evaluate left, evaluate right with
        // => Two successful child values can be added.
        | Ok a, Ok b -> Ok(a + b)
        // => If either child failed, keep that error.
        | Error error, _ | _, Error error -> Error error
    // => Divide likewise has a left and right child.
    | Divide(left, right) ->
        // => Evaluate both children before checking the divisor.
        match evaluate left, evaluate right with
        // => Preserve a child error before considering zero division.
        | Error error, _ | _, Error error -> Error error
        // => When both succeed but the divisor is zero, reject it.
        | Ok _, Ok 0 -> Error "division by zero"
        // => Only two successful values with a nonzero divisor are divided.
        | Ok a, Ok b -> Ok(a / b)
// => The pipeline formats a successful answer.
let shown = Add(Number 2, Number 3) |> evaluate |> Result.map string
// => This prints Ok "5".
printfn "%A" shown
