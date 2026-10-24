// => Capstone: a grade-book summarizer with an embedded suite and golden transcript.
let dir = __SOURCE_DIRECTORY__ // => the unit folder anchors input and lock samples.
// => The suite records silently; only the summary prints, like a quiet formatter.
let results = ResizeArray<string * bool>() // => the suite record: name plus verdict.
// => record compares and remembers; printing waits for the summary below.
let record name expected actual = // => name, want, and got in.
    results.Add((name, expected = actual)) // => the verdict joins the record.
// => The parser under test: name:score in, tagged outcome out.
let parseLine (line: string) = // => one roster line in, tagged pair out.
    // => Split on the colon; two parts parse, anything else complains.
    let parts = line.Split([|':'|]) // => name and score, or the wrong shape.
    if parts.Length = 2 then // => the two-part shape parses further.
        match System.Int32.TryParse(parts.[1]) with // => total attempt on the score.
        | true, n -> Ok (parts.[0], n) // => digits wrap with their name.
        | false, _ -> Error (sprintf "bad score: %s" line) // => bad score names its line.
    else Error (sprintf "bad line: %s" line) // => wrong shape names its line.
// => The ranker under test: score descends, names break ties alphabetically.
let top (rs: (string * int) list) n = // => roster plus count in, leaders out.
    rs |> List.sortBy (fun (name, score) -> (-score, name)) |> List.truncate n // => one key, full order.
// => Three facts pin parsing and ranking before any report prints.
record "parses good line" (Ok ("ada", 95)) (parseLine "ada:95") // => good lines wrap.
record "rejects bad score" (Error "bad score: x:y") (parseLine "x:y") // => bad scores complain exactly.
record "ranks ties alphabetically" [ ("a", 90); ("b", 90) ] (top [ ("b", 90); ("a", 90) ] 2) // => ties break by name.
// => The gate reads the summary as data; red suites stop the report cold.
let failed = results |> Seq.filter (fun (_, p) -> not p) |> Seq.length // => red cases counted.
if failed > 0 then failwithf "suite red: %d of %d failed" failed results.Count // => red stops nonzero.
// => Loud boundary: a missing input file reports to stderr and exits nonzero.
let inputPath = System.IO.Path.Combine(dir, "input.txt") // => the committed eight-line fixture.
if not (System.IO.File.Exists(inputPath)) then // => the absent-file branch.
    eprintfn "missing input: %s" inputPath // => the loud stderr message.
    System.Environment.Exit(1) // => nonzero exit: silence is not an option.
// => Read, trim, and drop blanks: files carry trailing newlines and gaps.
let lines = // => clean entries out of raw file lines.
    System.IO.File.ReadAllLines(inputPath) // => raw lines including the trailing gap.
    |> Array.map (fun s -> s.Trim()) // => whitespace stripped per line.
    |> Array.filter (fun s -> s <> "") // => blank lines removed.
    |> Array.toList // => the eight roster lines as a list.
// => Parse every line; the fixture is fixed, so every line parses here.
let students = lines |> List.map parseLine |> List.choose (function Ok v -> Some v | Error _ -> None) // => eight pairs.
// => Classify at sixty: passes and fails counted separately.
let passed = students |> List.filter (fun (_, s) -> s >= 60) // => seven and above hold.
let failedStudents = students |> List.filter (fun (_, s) -> s < 60) // => below sixty drops.
// => Rank the top three with the pinned comparator.
let leaders = top students 3 // => ada, turing, grace in rank order.
// => The sample lock declares the pinning posture: framework plus empty census.
let locked = System.IO.File.ReadAllText(System.IO.Path.Combine(dir, "sample.packages.lock.json")) // => raw lock text.
let tfm = if locked.Contains("net10.0") then "net10.0" else "unknown" // => the pinned framework read out.
let deps = locked.Split([|"\"resolved\":"|], System.StringSplitOptions.None).Length - 1 // => resolved entries counted.
// => The side report lands under /tmp; stdout stays the asserted transcript.
let report = (leaders |> List.map (fun (name, score) -> sprintf "%s: %d" name score) |> fun rs -> System.String.Join("\n", rs)) + "\n" // => one leader per line.
System.IO.File.WriteAllText("/tmp/fsharp-in-depth-capstone-report.txt", report) // => the /tmp side report.
// => The transcript: summary, headlines, pins, then the ranked three.
printfn "suite: %d tests, %d failures" results.Count failed // => the suite summary line.
printfn "lines=%d students=%d passed=%d failed=%d" lines.Length students.Length passed.Length failedStudents.Length // => the headline totals.
printfn "pins=%s stdlib-only deps=%d" tfm deps // => framework, posture, and empty census.
for (name, score) in leaders do printfn "%s: %d" name score // => the ranked top three.
