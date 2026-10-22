// => Example 16: use ties disposal to scope exit on every path.
let readTwo (text: string) = // => text in, lines plus disposed flag out.
    // => use instead of let: the reader disposes itself at scope end.
    use reader = new System.IO.StringReader(text) // => the bound disposable.
    // => Read both lines while the reader is alive; disposal happens after.
    let first = reader.ReadLine() // => first line read inside the scope.
    let second = reader.ReadLine() // => second line read inside the scope.
    // => Tuple answers the data; cleanup already scheduled by use.
    (first, second) // => the two lines travel out together.
// => Fixed input with two lines; the tuple destructures at the call site.
let (a, b) = readTwo "alpha\nbeta" // => a is alpha, b is beta.
// => Disposal is structural: no explicit call appears anywhere above.
printfn "first=%s second=%s" a b // => first=alpha second=beta.
