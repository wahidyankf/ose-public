// => Example 7: an endless pipeline that computes only five answers.
let naturals = Seq.initInfinite (fun i -> i + 1) // => 1, 2, 3, ...: never ends, never starts.
// => The pipeline describes stages; iteration below is what runs them.
let oddSquares = // => odd squares drawn from the endless source.
    naturals // => stage one: the endless input, still uncomputed.
    |> Seq.map (fun n -> n * n) // => stage two: square each as it is pulled.
    |> Seq.filter (fun s -> s % 2 = 1) // => stage three: keep odd squares only.
// => take pulls exactly five; the infinite tail is never touched.
let firstFive = Seq.take 5 oddSquares |> Seq.toList // => [1; 9; 25; 49; 81].
// => Materializing proves laziness: five answers out of an endless source.
printfn "%A" firstFive // => [1; 9; 25; 49; 81].
