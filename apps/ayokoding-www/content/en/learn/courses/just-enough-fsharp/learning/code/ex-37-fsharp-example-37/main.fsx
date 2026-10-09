// => The active pattern classifies an integer into one of two cases.
let (|Even|Odd|) value = if value % 2 = 0 then Even else Odd
// => The match reads in domain terms.
let describe value = match value with Even -> "even" | Odd -> "odd"
// => This prints odd.
printfn "%s" (describe 7)
