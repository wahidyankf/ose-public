// => Example 12: three validations chained; the first failure wins.
let parse (text: string) = // => stage one: digits or a tagged complaint.
    match System.Int32.TryParse(text) with // => total attempt, no throw.
    | true, n -> Ok n // => digits ride the happy track.
    | false, _ -> Error "not a number" // => anything else switches tracks.
// => Stage two: the range check only ever sees parsed numbers.
let checkRange n = // => number in, ranged number or complaint out.
    if n >= 0 && n <= 150 then Ok n // => sane ages continue down the line.
    else Error (sprintf "out of range: %d" n) // => absurd ages leave the track.
// => Stage three: labeling only runs for validated numbers.
let label n = if n >= 18 then Ok "adult" else Ok "minor" // => labels never fail.
// => bind threads Ok forward and carries the first Error past the rest.
let classify text = parse text |> Result.bind checkRange |> Result.bind label // => the railway.
// => Good, unparseable, and absurd inputs each take their own path.
let show outcome = match outcome with Ok s -> s | Error m -> sprintf "error: %s" m // => render tags.
printfn "%s %s %s" (show (classify "36")) (show (classify "old")) (show (classify "300")) // => adult error: not a number error: out of range: 300.
