// => Example 46: one outcome shape, two payload pairs, one transformer.
type Outcome<'ok, 'err> = // => the domain outcome: success or complaint.
    | Good of 'ok // => the happy case carries any success payload.
    | Bad of 'err // => the sad case carries any complaint payload.
// => mapGood transforms the inside across both uses without unwrapping.
let mapGood f outcome = // => function and outcome in, transformed outcome out.
    match outcome with // => the shape decides; payloads ride along.
    | Good v -> Good (f v) // => transform inside Good.
    | Bad e -> Bad e // => Bad passes through untouched.
// => Numeric use: parse ages with string complaints.
let n1: Outcome<int, string> = Good 36 |> mapGood (fun n -> n + 1) // => Good 37.
// => Text use: look up names with integer error codes.
let n2: Outcome<string, int> = Bad 404 |> mapGood (fun (s: string) -> s.ToUpperInvariant()) // => Bad 404 untouched.
printfn "num=%A miss=%A" n1 n2 // => num=Good 37 miss=Bad 404.
