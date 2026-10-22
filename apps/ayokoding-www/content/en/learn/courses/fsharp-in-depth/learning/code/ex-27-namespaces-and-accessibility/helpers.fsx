// => Shop namespace: two public modules share one internal formatter.
namespace Shop // => the consumer-facing group name for these modules.
// => Internal helpers cross modules inside the assembly but never leave it.
module internal Format = // => the shared formatter, assembly-visible only.
    // => One formatting rule for every money line in this namespace.
    let money (amount: float) = sprintf "%.2f" amount // => two decimals, always.
// => Public modules promise totals; they share the internal formatter.
module Cart = // => cart totals live here.
    // => Public function: quantity times price, formatted through the helper.
    let total qty price = Format.money (float qty * price) // => 3 x 10.00.
// => A second public module reuses the same internal formatter.
module Shelf = // => shelf labels live here.
    // => Same helper, same format: one rule across modules.
    let label name price = sprintf "%s: %s" name (Format.money price) // => one label shape.
