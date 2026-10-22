// => Example 2: match tests one value against a table of shapes.
let role = "editor" // => the fixed input every clause below tests.
// => The match answers a string; each arm must answer the same type.
let access = // => the access binding the winning arm answers into.
    // => Clauses run top to bottom; the first fitting shape wins.
    match role with // => test the role against each shape in order.
    // => Literal clauses name exact values, most specific first.
    | "admin" -> "all areas" // => first literal shape: full access.
    // => A guard refines a shape with a boolean the pattern cannot ask.
    | name when name.StartsWith("edit") -> "edit only" // => guarded shape: editing rights.
    // => The wildcard is the documented fallback, never a silent hole.
    | _ -> "read only" // => fallback shape: reading rights for the rest.
// => One print proves the guard arm won over the wildcard below it.
printfn "role=%s access=%s" role access // => role=editor access=edit only.
