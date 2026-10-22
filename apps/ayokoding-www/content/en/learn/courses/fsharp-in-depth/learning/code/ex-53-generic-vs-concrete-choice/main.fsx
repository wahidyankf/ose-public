// => Example 53: one generic membership plus one concrete domain rule.
let contains (x: 'a) (xs: 'a list) = List.contains x xs // => generic: any equality type.
// => Concrete domain rule: the type names are the documentation here.
let isAdmin (role: string) = role = "admin" || role = "root" // => admin check, strings only.
// => The generic serves ints and strings from its single definition.
let a = contains 3 [ 1; 2; 3 ] // => ints: present.
let b = contains "ada" [ "lin"; "grace" ] // => strings: absent.
// => The concrete answers the domain question directly.
let c = isAdmin "root" // => true: root counts as admin here.
printfn "int=%b name=%b admin=%b" a b c // => int=true name=false admin=true.
