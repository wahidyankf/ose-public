// => Example 20: one compiled pattern pulls two named fields from a log line.
let line = "ERROR E102: disk quota exceeded" // => the fixed line under test.
// => Compile once for repeated use; named groups document each capture.
let pattern = System.Text.RegularExpressions.Regex(@"^(?<level>[A-Z]+)\s+(?<code>E\d+):", System.Text.RegularExpressions.RegexOptions.Compiled) // => level and code groups.
// => Match attempts once; Success gates every group read below.
let m = pattern.Match(line) // => the single attempt against the fixed line.
// => Check success first: group reads are only valid on a match.
let outcome = // => the verdict answers one string either way.
    if m.Success then sprintf "%s/%s" m.Groups.["level"].Value m.Groups.["code"].Value // => ERROR/E102.
    else "no-match" // => the miss arm keeps the pipeline total.
printfn "line=%s => %s" line outcome // => line=ERROR E102: disk quota exceeded => ERROR/E102.
