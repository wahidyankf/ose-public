// => Example 30: three payment shapes, one fee function, all cases covered.
type Payment = // => the closed set of methods this program accepts.
    | Cash // => no payload: cash carries nothing.
    | Card of number: string * expiry: string // => card carries its identifiers.
    | Transfer of account: string * reference: string // => transfer carries its trail.
// => The fee depends on the shape: each arm reads its own fields.
let fee payment = // => payment in, fee in the same currency units out.
    match payment with // => every case below must appear, compiler-checked.
    | Cash -> 0 // => cash costs nothing to accept.
    | Card _ -> 2 // => cards cost a flat two.
    | Transfer _ -> 1 // => transfers cost a flat one.
// => Three fixed payments print their three fees in case order.
printfn "cash=%d card=%d wire=%d" (fee Cash) (fee (Card ("4111", "12/28"))) (fee (Transfer ("8-123", "ref-9"))) // => cash=0 card=2 wire=1.
