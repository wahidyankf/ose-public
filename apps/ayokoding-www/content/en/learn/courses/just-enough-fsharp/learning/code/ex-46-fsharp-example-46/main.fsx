// => A module keeps these functions together.
module Pricing =
    // => The fee is added to the supplied amount.
    let addFee fee amount = amount + fee
    // => This second function doubles an amount without state.
    let doubleAmount amount = amount * 2
// => Qualify a function with the module name.
printfn "%d" (Pricing.addFee 3 10)
