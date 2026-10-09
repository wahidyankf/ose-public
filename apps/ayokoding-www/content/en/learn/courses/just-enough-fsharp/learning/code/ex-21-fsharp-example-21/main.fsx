// => The domain rule rejects negative quantities.
let quantity value = if value >= 0 then Ok value else Error "negative quantity"
// => The error remains data rather than an exception.
let checkedValue = quantity -2
// => This prints Error "negative quantity".
printfn "%A" checkedValue
