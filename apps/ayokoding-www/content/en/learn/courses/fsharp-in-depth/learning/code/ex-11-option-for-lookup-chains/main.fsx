// => Example 11: two dependent lookups chained through Option.bind.
let users = Map.ofList [ ("u1", "ada") ] // => user ids to display names.
let emails = Map.ofList [ ("ada", "ada@example.com") ] // => names to emails.
// => bind feeds a hit into the next lookup; a miss skips every later step.
let resolve userId = // => id in, email-or-fallback out.
    users // => start from the first table.
    |> Map.tryFind userId // => Option<name>: hit or miss.
    |> Option.bind (fun name -> Map.tryFind name emails) // => Option<email>: miss shorts here.
    |> Option.defaultValue "unknown@example.com" // => one fallback at the edge.
// => Known id resolves fully; unknown id and dangling name both fall back.
let dangling = Map.ofList [ ("u9", "nobody") ] // => id whose name has no email.
let via table id = table |> Map.tryFind id |> Option.bind (fun n -> Map.tryFind n emails) |> Option.defaultValue "unknown@example.com" // => same chain, other table.
printfn "%s %s %s" (resolve "u1") (resolve "u2") (via dangling "u9") // => ada@example.com unknown@example.com unknown@example.com.
