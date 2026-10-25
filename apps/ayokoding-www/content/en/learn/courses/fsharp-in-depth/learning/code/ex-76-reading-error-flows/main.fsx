// => Example 76: two ages through the railway; exits mapped, outcomes rendered.
let parse (text: string) = // => stage one: digits or a tagged complaint.
    match System.Int32.TryParse(text) with // => total attempt.
    | true, n -> Ok n // => digits ride on.
    | false, _ -> Error "not-a-number" // => exit ramp one.
// => Stage two only sees parsed numbers: the railway guarantees it.
let checkRange n = if n >= 0 && n <= 150 then Ok n else Error "out-of-range" // => exit ramp two.
// => The chain: parse, then range, then label — errors skip ahead.
let classify text = parse text |> Result.bind checkRange |> Result.map (fun n -> if n >= 18 then "adult" else "minor") // => the flow.
// => One renderer for every exit plus the happy path.
let show o = match o with Ok s -> s | Error m -> sprintf "error:%s" m // => all outcomes shown.
printfn "%s %s %s" (show (classify "36")) (show (classify "old")) (show (classify "300")) // => adult error:not-a-number error:out-of-range.
