// => Each step returns Result<int,string>.
let positive value = if value > 0 then Ok value else Error "not positive"
// => The second rule rejects 10 and larger after the first rule succeeds.
let underTen value = if value < 10 then Ok value else Error "too large"
// => bind skips the next step after Error.
let checkedValue = positive 12 |> Result.bind underTen
// => This prints Error "too large".
printfn "%A" checkedValue
