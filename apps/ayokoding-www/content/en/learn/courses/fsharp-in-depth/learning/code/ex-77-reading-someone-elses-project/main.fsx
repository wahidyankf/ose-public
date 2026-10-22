// => Example 77: a stranger's project read in checklist order.
let dir = __SOURCE_DIRECTORY__ // => the unit folder anchors both samples.
// => Fact one and two: the SDK import and the target framework.
let proj = System.IO.File.ReadAllText(System.IO.Path.Combine(dir, "sample.fsproj")) // => project text.
let sdk = proj.Contains("Microsoft.NET.Sdk") // => SDK declared.
let tfm = if proj.Contains("net10.0") then "net10.0" else "unknown" // => framework read out.
// => Fact three: the compile list names sources in compilation order.
let sources = proj.Split([|'"'|]) |> Array.filter (fun s -> s.EndsWith(".fs")) // => F# sources listed.
// => Fact four: the lock census counts outside trust at zero.
let locked = System.IO.File.ReadAllText(System.IO.Path.Combine(dir, "sample.packages.lock.json")) // => lock text.
let deps = locked.Split([|"\"resolved\":"|], System.StringSplitOptions.None).Length - 1 // => resolved entries.
printfn "sdk=%b tfm=%s sources=%s deps=%d" sdk tfm (System.String.Join(",", sources)) deps // => sdk=true tfm=net10.0 sources=Program.fs deps=0.
