// => Example 26: a module with one public function and one hidden helper.
module Pricing = // => the boundary: everything inside serves pricing.
    // => Private helpers stay inside: callers cannot reach them, renames stay free.
    let private discountRate qty = if qty >= 10 then 0.9 else 1.0 // => bulk earns ten percent off.
    // => The public promise: quantity and unit price in, charged total out.
    let total qty price = float qty * price * discountRate qty // => one public door.
// => Callers open the module and use the promise, never the helper.
open Pricing // => bring total into scope for the transcript below.
// => Two orders print: bulk gets the discount, small pays full price.
printfn "bulk=%.2f small=%.2f" (total 12 10.0) (total 3 10.0) // => bulk=108.00 small=30.00.
