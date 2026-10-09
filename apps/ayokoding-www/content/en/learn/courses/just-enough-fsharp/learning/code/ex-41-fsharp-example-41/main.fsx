// => Result.map calls the function only for Ok.
let original: Result<int, string> = Ok 4
// => The error type stays string.
let doubled = original |> Result.map (fun value -> value * 2)
// => This prints Ok 8.
printfn "%A" doubled
