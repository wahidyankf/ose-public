// => Example 68: one tolerant pattern parsing three varied header lines.
let lines = [ "INFO count=12"; "warn COUNT=7"; "Error Count=3" ] // => mixed-case corpus lines.
// => IgnoreCase tolerates the mixed levels; Compiled pays once for reuse.
let pattern = System.Text.RegularExpressions.Regex(@"^(?<level>[a-z]+)\s+count=(?<n>\d+)$", System.Text.RegularExpressions.RegexOptions.IgnoreCase ||| System.Text.RegularExpressions.RegexOptions.Compiled) // => level plus count.
// => Each line extracts through the same pattern; successes read named groups.
let pull line = // => line in, level-and-count or miss out.
    let m = pattern.Match(line) // => the single attempt per line.
    if m.Success then sprintf "%s=%s" (m.Groups.["level"].Value.ToLowerInvariant()) m.Groups.["n"].Value // => normalized pair.
    else "miss" // => misses stay visible, never silent.
// => All three lines extract; total proves the counts compose.
let pairs = lines |> List.map pull // => three normalized pairs.
printfn "%s total=%d" (System.String.Join(" ", pairs)) (pairs |> List.sumBy (fun p -> int (p.Split('=').[1]))) // => info=12 warn=7 error=3 total=22.
