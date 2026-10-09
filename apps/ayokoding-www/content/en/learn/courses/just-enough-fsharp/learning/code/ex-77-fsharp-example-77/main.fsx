// => The original failure remains a Result value.
let parsed: Result<int, string> = Error "zero divisor"
// => mapError changes only the Error payload.
let labeled = parsed |> Result.mapError (fun message -> "evaluation: " + message)
// => This prints Error "evaluation: zero divisor".
printfn "%A" labeled
