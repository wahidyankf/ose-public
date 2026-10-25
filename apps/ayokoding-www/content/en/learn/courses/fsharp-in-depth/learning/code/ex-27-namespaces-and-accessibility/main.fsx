// => Example 27: a namespace with two modules and one internal helper.
#load "helpers.fsx" // => the namespace file joins this script at this line.
// => Cart and Shelf come from the loaded namespace; the rule stays hidden.
open Shop // => bring both public modules into scope for the transcript.
// => Both public doors print through the one internal rule.
printfn "%s | %s" (Cart.total 3 10.0) (Shelf.label "engine" 19.995) // => 30.00 | engine: 20.00.
