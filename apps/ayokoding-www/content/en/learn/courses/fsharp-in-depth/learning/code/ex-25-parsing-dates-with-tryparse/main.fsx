// => Example 25: one exact pattern parses two stamps; the boolean gates reads.
open System.Globalization // => invariant culture and date styles live here.
// => The pattern is the contract: dashes, four-digit year, nothing else.
let pattern = "yyyy-MM-dd" // => the one accepted shape.
// => Total parser: boolean out front, value valid only when it is true.
let parseDate (text: string) = // => text in, tagged outcome out.
    // => TryParseExact attempts the single shape; no exceptions on failure.
    match System.DateTime.TryParseExact(text, pattern, CultureInfo.InvariantCulture, DateTimeStyles.None) with // => one attempt.
    | true, d -> Ok (d.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)) // => success normalizes.
    | false, _ -> Error (sprintf "bad date: %s" text) // => failure names the text.
// => Good stamp parses, bad stamp reports; the pattern decided both.
let show o = match o with Ok s -> s | Error m -> m // => uniform tag renderer.
printfn "%s | %s" (show (parseDate "2026-10-21")) (show (parseDate "21/10/2026")) // => 2026-10-21 | bad date: 21/10/2026.
