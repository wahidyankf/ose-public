type Expr =
    | Number of int
    | Add of Expr * Expr
    | Divide of Expr * Expr

type Evaluation = { Expression: Expr; Label: string }

let rec evaluate expression =
    match expression with
    | Number value -> Ok value
    | Add(left, right) ->
        match evaluate left, evaluate right with
        | Ok a, Ok b -> Ok(a + b)
        | Error error, _
        | _, Error error -> Error error
    | Divide(left, right) ->
        match evaluate left, evaluate right with
        | Error error, _
        | _, Error error -> Error error
        | Ok _, Ok 0 -> Error "division by zero"
        | Ok a, Ok b -> Ok(a / b)

let render evaluation =
    evaluate evaluation.Expression
    |> Result.map (fun value -> evaluation.Label + ": " + string value)

let assertEqual expected actual =
    if expected <> actual then
        failwithf "expected %A but got %A" expected actual

let sample =
    { Expression = Add(Number 2, Number 3)
      Label = "sum" }

assertEqual (Ok "sum: 5") (render sample)
assertEqual (Ok 6) (evaluate (Divide(Number 18, Number 3)))
assertEqual (Error "division by zero") (evaluate (Divide(Number 1, Number 0)))

assertEqual
    (Error "division by zero")
    (render
        { Expression = Add(Number 2, Divide(Number 1, Number 0))
          Label = "invalid" })

printfn "%A" (render sample)
