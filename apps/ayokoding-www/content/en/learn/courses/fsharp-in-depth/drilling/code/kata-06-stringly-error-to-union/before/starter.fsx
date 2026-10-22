// => Kata 6 starter: grading failures travel as formatted strings.
let grade score = // => score in, letter or complaint string out.
    // => Failures bake their facts into prose callers must re-parse.
    if score < 0 then sprintf "bad:%d" score // => stringly failure, facts baked in.
    elif score >= 90 then "A" // => the top band.
    elif score >= 60 then "C" // => the passing band.
    else "F" // => the failing band.
// => Callers print strings; the score facts are lost inside the prose.
printfn "%s %s" (grade 95) (grade -5) // => A bad:-5, facts baked into text.
