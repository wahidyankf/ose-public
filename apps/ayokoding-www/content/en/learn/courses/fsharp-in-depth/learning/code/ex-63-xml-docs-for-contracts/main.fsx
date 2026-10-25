// => Example 63: contracts in docs, reasons inline, both serving readers.
module Stats = // => the documented statistics module.
    /// <summary>Mean of a list; empty lists answer None.</summary> // => contract: inputs to outputs.
    let mean (xs: float list) = // => the promise the docs above state.
        // => Empty leads because it decides the shape, matching the doc sentence.
        match xs with // => the total structure the contract requires.
        | [] -> None // => absence, not a crash: as documented.
        | _ -> Some (List.sum xs / float xs.Length) // => the mean for the rest.
    /// <summary>Range of a list; empty lists answer None.</summary> // => same doc shape, second promise.
    let range (xs: float list) = // => max minus min for non-empty lists.
        match xs with // => total structure again.
        | [] -> None // => absence, as documented.
        | _ -> Some (List.max xs - List.min xs) // => the spread.
// => Both promises print through option rendering at the call site.
let show o = match o with None -> "none" | Some v -> sprintf "%.1f" v // => one renderer.
printfn "mean=%s range=%s" (show (Stats.mean [ 1.0; 2.0; 3.0 ])) (show (Stats.range [])) // => mean=2.0 range=none.
