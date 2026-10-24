// => Example 10: three fields parse; failures arrive tagged with context.
let parseInt field (text: string) = // => field name in, tagged outcome out.
    // => TryParse keeps the attempt total: no throw on bad input.
    match System.Int32.TryParse(text) with // => one attempt, two arms.
    | true, n -> Ok n // => digits wrap as Ok with the number inside.
    | false, _ -> Error (sprintf "field %s: not a number: %s" field text) // => context rides along.
// => Each field parses independently; results collect without short-circuit.
let age = parseInt "age" "36" // => Ok 36: the good field.
let zip = parseInt "zip" "02139" // => Ok 2139: leading zero parses fine.
let bad = parseInt "age" "old" // => Error: the bad field names itself.
// => Rendering matches tags; successes print numbers, failures print blame.
let show label outcome = // => uniform renderer for every field result.
    match outcome with // => the tag decides the shape of the line.
    | Ok n -> sprintf "%s=%d" label n // => good fields print bare.
    | Error msg -> sprintf "%s!%s" label msg // => bad fields print flagged.
printfn "%s %s %s" (show "age" age) (show "zip" zip) (show "bad" bad) // => age=36 zip=2139 bad!field age: not a number: old.
