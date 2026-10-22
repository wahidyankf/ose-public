// => Example 42: Slow Checks Opt Out.
// => Slow suites read one variable: SLOW_TESTS=1 runs them, anything else skips.
string? flag = Environment.GetEnvironmentVariable("SLOW_TESTS"); // => the harness pins SLOW_TESTS=0

// => the fast check always runs: it costs nothing and guards the happy path
Console.WriteLine("PASS: rice costs 12000"); // => fast suite: always green here

// => the slow check runs only on demand: the transcript says skipped, honestly
if (flag == "1") // => opt-in: only an explicit 1 pays for the slow suite
{
    Console.WriteLine("PASS: full menu audit over 200 dishes"); // => runs only when asked
}
else // => skipped is a verdict too: recorded, never silent
{
    Console.WriteLine($"SKIP: slow suite (SLOW_TESTS={flag})"); // => Output: SKIP: slow suite (SLOW_TESTS=0)
}
