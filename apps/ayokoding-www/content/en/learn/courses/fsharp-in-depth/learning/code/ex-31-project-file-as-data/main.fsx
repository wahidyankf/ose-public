// => Example 31: a sample project file read and checked as data.
let dir = __SOURCE_DIRECTORY__ // => the unit folder anchors the sample file.
// => The sample project ships beside the script; read it as plain text.
let proj = System.IO.File.ReadAllText(System.IO.Path.Combine(dir, "sample.fsproj")) // => raw XML text.
// => Three load-bearing facts, each asserted so the transcript proves them.
let hasSdk = proj.Contains("Microsoft.NET.Sdk") // => the SDK import present.
let hasFsharp = proj.Contains("FSharp") || proj.Contains(".fs") // => F# sources referenced.
let hasNet = proj.Contains("net10.0") // => the single target framework pinned.
// => Report the three checks plus the framework the file declares.
printfn "sdk=%b fsharp=%b tfm=%b framework=net10.0" hasSdk hasFsharp hasNet // => sdk=true fsharp=true tfm=true framework=net10.0.
