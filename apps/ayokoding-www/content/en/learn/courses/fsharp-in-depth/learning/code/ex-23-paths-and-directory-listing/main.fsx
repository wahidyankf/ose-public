// => Example 23: portable combine plus a sorted, display-safe listing.
let dir = __SOURCE_DIRECTORY__ // => the unit folder anchors every path here.
// => Combine inserts the right separator; no literal slashes anywhere.
let probe = System.IO.Path.Combine(dir, "roster.txt") // => sibling file, portable path.
// => GetFileName strips the machine-specific directory for display.
let display = System.IO.Path.GetFileName(probe) // => roster.txt on every machine.
// => The fixture directory ships two data files; listing must sort them.
let dataDir = System.IO.Path.Combine(dir, "data") // => the committed data folder.
let names = // => bare names, sorted: the deterministic listing contract.
    System.IO.Directory.GetFiles(dataDir) // => full paths in filesystem order.
    |> Array.map System.IO.Path.GetFileName // => strip directories for display.
    |> Array.sort // => impose order: filesystems promise none.
printfn "file=%s data=%s" display (System.String.Join(",", names)) // => file=roster.txt data=a.txt,b.txt.
