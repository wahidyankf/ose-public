// => Example 4: Result carries expected failures as tagged data.
let parseAge (text: string) = // => the parser: digits in, tagged outcome out.
    // => TryParse never throws: the boolean says whether digits were found.
    match System.Int32.TryParse(text) with // => attempt the parse once.
    // => The success arm wraps the number so callers match instead of catch.
    | true, n -> Ok n // => Ok arm: digits became a number.
    // => The failure arm keeps the offending text inside the message.
    | false, _ -> Error (sprintf "not a number: %s" text) // => Error arm: context preserved.
// => Two fixed inputs: one parses, one does not, both handled the same way.
let render outcome = // => one renderer for both tags keeps handling uniform.
    // => Matching the tag is the whole handling: no try/with needed here.
    match outcome with // => branch on the tag the parser returned.
    | Ok n -> sprintf "age=%d" n // => Ok prints the parsed number.
    | Error msg -> sprintf "bad=%s" msg // => Error prints the carried message.
// => Both outcomes print through the same renderer with no surprises.
printfn "%s | %s" (render (parseAge "36")) (render (parseAge "old")) // => age=36 | bad=not a number: old.
