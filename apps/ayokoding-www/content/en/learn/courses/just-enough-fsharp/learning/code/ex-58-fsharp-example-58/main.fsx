// => A tree is either a leaf or a branch with two children.
type Tree = Leaf of int | Branch of Tree * Tree
// => The match visits every leaf exactly once.
let rec sum tree =
    // => Inspect whether the tree node is a leaf or branch.
    match tree with
    // => A leaf contributes exactly its stored integer.
    | Leaf value -> value
    // => A branch contributes the sums of both child trees.
    | Branch(left, right) -> sum left + sum right
// => This prints 9.
printfn "%d" (sum (Branch(Leaf 4, Leaf 5)))
