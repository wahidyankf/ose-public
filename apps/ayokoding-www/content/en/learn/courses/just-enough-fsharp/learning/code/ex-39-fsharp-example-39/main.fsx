// => TryParse returns a success flag and parsed value as a tuple in F#.
let parse (text: string) =
    // => TryParse returns both a success flag and a value.
    match System.Int32.TryParse text with
    // => A successful parse becomes Some of its integer.
    | true, value -> Some value
    // => Invalid text becomes None instead of an exception.
    | false, _ -> None
// => This prints None for invalid input.
printfn "%A" (parse "twelve")
