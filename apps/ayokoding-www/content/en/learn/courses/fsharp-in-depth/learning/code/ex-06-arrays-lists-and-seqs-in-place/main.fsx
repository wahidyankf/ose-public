// => Example 6: three containers, one dataset, each asked its own question.
let asList = [ 10; 20; 30; 40 ] // => the list: prepend-shaped, recursion-ready.
let asArray = [| 10; 20; 30; 40 |] // => the array: index-shaped, fixed size.
let asSeq = seq { 10; 20; 30; 40 } // => the sequence: computes only on demand.
// => Head and tail fall out of list construction; no indexing needed.
let head = List.head asList // => 10: the first element by construction.
// => Indexing is the array question; bounds_checked access is constant time.
let third = asArray.[2] // => 30: direct indexing into the array.
// => Seq.item pulls only what it needs; the rest stays uncomputed.
let thirdLazy = Seq.item 2 asSeq // => 30: computed on demand, same answer.
// => Length works on all three; the answers agree because the data agrees.
printfn "head=%d third=%d lazy=%d lens=%d,%d,%d" head third thirdLazy (List.length asList) asArray.Length (Seq.length asSeq) // => head=10 third=30 lazy=30 lens=4,4,4.
