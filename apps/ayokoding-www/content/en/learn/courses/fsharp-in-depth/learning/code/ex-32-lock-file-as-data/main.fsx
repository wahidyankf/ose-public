// => Example 32: a sample lock file read as a dependency census.
let dir = __SOURCE_DIRECTORY__ // => the unit folder anchors the sample lock.
// => Read the sample lock as text; counting markers needs no JSON library.
let locked = System.IO.File.ReadAllText(System.IO.Path.Combine(dir, "sample.packages.lock.json")) // => raw lock text.
// => The framework key names the target; resolved entries name the packages.
let hasNet = locked.Contains("net10.0") // => the pinned target framework.
let depCount = locked.Split([|"\"resolved\":"|], System.StringSplitOptions.None).Length - 1 // => resolved entries counted.
// => Zero resolved entries is the stdlib-only declaration, printed as data.
printfn "framework=net10.0 pinned=%b deps=%d stdlib-only=%b" hasNet depCount (depCount = 0) // => framework=net10.0 pinned=true deps=0 stdlib-only=true.
