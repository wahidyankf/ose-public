// => Example 74: a classifier read once, a match reading cleanly after.
let (|Even|Odd|) n = if n % 2 = 0 then Even else Odd // => total classifier: every int fits.
// => The match below reads as cases because the classifier did the arithmetic.
let label n = // => number in, parity word out.
    match n with // => cases over the classification, not the modulo.
    | Even -> "even" // => even arm: no arithmetic visible.
    | Odd -> "odd" // => odd arm: the decision stands alone.
// => One to ten classified through the pattern; counts prove the split.
let words = [ 1 .. 10 ] |> List.map label // => ten words, alternating.
let evens = words |> List.filter (fun w -> w = "even") |> List.length // => five evens.
printfn "%s evens=%d" (System.String.Join(",", words)) evens // => odd,even,odd,even,odd,even,odd,even,odd,even evens=5.
