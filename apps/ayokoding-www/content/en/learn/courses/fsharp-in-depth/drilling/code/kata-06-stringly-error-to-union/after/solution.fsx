// => Kata 6 solution: failures travel as union cases with fields.
type GradeError = Negative of score: int // => the failure fact as a field.
// => The grader answers Result: letters on Ok, facts on Error.
let grade score = // => score in, tagged outcome out.
    if score < 0 then Error (Negative score) // => facts, not prose.
    elif score >= 90 then Ok "A" // => the top band.
    elif score >= 60 then Ok "C" // => the passing band.
    else Ok "F" // => the failing band.
// => Strings form only at the edge where humans read.
let show o = match o with Ok g -> g | Error (Negative s) -> sprintf "bad:%d" s // => one renderer.
printfn "%s %s" (show (grade 95)) (show (grade -5)) // => A bad:-5, facts as fields.
