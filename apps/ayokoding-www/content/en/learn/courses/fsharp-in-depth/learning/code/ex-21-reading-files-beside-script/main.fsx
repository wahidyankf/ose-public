// => Example 21: a committed fixture read through the source directory.
let dir = __SOURCE_DIRECTORY__ // => the unit folder, whatever launched this.
// => Combine keeps separators correct on every operating system.
let path = System.IO.Path.Combine(dir, "roster.txt") // => the sibling fixture.
// => Read, trim, and drop blanks: files carry trailing newlines and gaps.
let names = // => clean entries out of raw file lines.
    System.IO.File.ReadAllLines(path) // => raw lines including the trailing gap.
    |> Array.map (fun s -> s.Trim()) // => whitespace stripped per line.
    |> Array.filter (fun s -> s <> "") // => blank lines removed.
// => Sort for determinism: file order is content, sorted order is contract.
let ordered = names |> Array.sort // => alphabetical, stable across machines.
printfn "count=%d first=%s last=%s" ordered.Length ordered.[0] ordered.[ordered.Length - 1] // => count=3 first=ada last=lin.
