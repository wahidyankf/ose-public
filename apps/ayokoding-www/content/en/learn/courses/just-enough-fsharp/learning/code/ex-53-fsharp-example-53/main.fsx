// => A partial active pattern returns Some or None.
let (|Integer|_|) (text: string) =
    // => TryParse decides whether this text can be viewed as an integer.
    match System.Int32.TryParse text with
    // => On success, the active pattern supplies the parsed number.
    | true, value -> Some value
    // => On failure, None lets the next match pattern run.
    | false, _ -> None
// => The pattern extracts the parsed value.
let describe text = match text with Integer n -> $"number {n}" | _ -> "other"
// => This prints number 42.
printfn "%s" (describe "42")
