// => Example 22: a verified round trip through a fixed scratch path.
let scratch = "/tmp/fsharp-in-depth-ex-22-report.txt" // => one fixed path: reruns overwrite.
// => Fixed bytes out: the content never varies, so the read below is pinned.
let body = "ada:3\ngrace:2\n" // => two fixed lines with a trailing newline.
// => Write the bytes, then read them back: the round trip is the test.
System.IO.File.WriteAllText(scratch, body) // => bytes land on the fixed path.
// => Read-back proves the write; length and line count pin the content.
let back = System.IO.File.ReadAllText(scratch) // => the same bytes, reread.
let lines = back.Split([|'\n'|], System.StringSplitOptions.RemoveEmptyEntries) // => two lines.
// => Delete first, print after: no residue survives a rerun or a crash.
System.IO.File.Delete(scratch) // => the scratch vanishes by construction.
let gone = not (System.IO.File.Exists(scratch)) // => true: removal verified.
printfn "lines=%d bytes=%d removed=%b" lines.Length back.Length gone // => lines=2 bytes=14 removed=true.
