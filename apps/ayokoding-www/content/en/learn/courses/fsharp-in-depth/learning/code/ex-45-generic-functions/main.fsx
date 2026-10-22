// => Example 45: three generics applied across ints, strings, and lists.
let twice x = (x, x) // => pair a value with itself: works for every 'a.
// => Pair with a label: the label type and value type vary independently.
let pairWith label value = (label, value) // => two parameters, two type variables.
// => firstOf picks the head of any list without caring what it holds.
let firstOf (xs: 'a list) : 'a = List.head xs // => the head, type preserved.
// => Same functions, three types: ints, strings, and lists share definitions.
let a = twice 21 // => (21, 21): int pair.
let b = pairWith "score" 95 // => (string, int): mixed pair.
let c = firstOf [ "ada"; "grace" ] // => ada: string head.
printfn "twice=%A labeled=%A first=%s" a b c // => twice=(21, 21) labeled=("score", 95) first=ada.
