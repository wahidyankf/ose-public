// => Example 64: three lights, three arms, no wildcard to hide behind.
type Light = Red | Yellow | Green // => the closed input: three cases, never four.
// => Every arm explicit: removing one warns, adding a case breaks loudly.
let action light = // => light in, driver instruction out.
    match light with // => the compiler checks this table complete.
    | Red -> "stop" // => the stop arm, named not wildcarded.
    | Yellow -> "ready" // => the caution arm, explicit too.
    | Green -> "go" // => the go arm completes the table.
// => All three lights print their instructions in declaration order.
printfn "%s %s %s" (action Red) (action Yellow) (action Green) // => stop ready go.
