// => Int32.Parse raises FormatException for invalid text.
let parseOrZero text =
    // => Parsing invalid text raises the specific format error.
    try System.Int32.Parse text
    // => This handler turns only FormatException into the fallback zero.
    with :? System.FormatException -> 0
// => The fallback is explicit in this small example.
printfn "%d" (parseOrZero "not-a-number")
