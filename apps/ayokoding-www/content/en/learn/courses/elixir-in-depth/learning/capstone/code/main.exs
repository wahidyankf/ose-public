# => Capstone: a log summarizer with an embedded suite and golden transcript.
ExUnit.start(auto_run: false, seed: 0, formatters: []) # => manual run, fixed seed, silent formatter.
# => The parser turns one line into a level tag; unknown lines are data too.
defmodule LogCap do # => the parse-count-rank module.
  def level("INFO " <> _), do: "info" # => INFO prefix maps to info.
  def level("WARN " <> _), do: "warn" # => WARN prefix maps to warn.
  def level("ERROR " <> _), do: "error" # => ERROR prefix maps to error.
  def level(_), do: "other" # => anything else maps to other.
  def summarize(lines), do: lines |> Enum.map(&level/1) |> Enum.frequencies() # => lines in, counts out.
  def top(counts, n), do: counts |> Enum.sort_by(fn {l, c} -> {-c, l} end) |> Enum.take(n) # => count desc, name asc.
end # => the module closes.
# => The suite pins parsing, counting, and ranking before any report prints.
defmodule LogCapTest do # => the three-test suite module.
  use ExUnit.Case, async: false # => synchronous cases; order is fixed.
  test "levels classify by prefix" do # => the parsing fact.
    assert LogCap.level("INFO up") == "info" # => INFO classifies as info.
    assert LogCap.level("nope") == "other" # => unknown classifies as other.
  end # => the parsing test closes.
  test "counts group by level" do # => the counting fact.
    assert LogCap.summarize(["INFO a", "ERROR b", "INFO c"]) == %{"info" => 2, "error" => 1} # => two info, one error.
  end # => the counting test closes.
  test "top breaks ties alphabetically" do # => the ranking fact.
    assert LogCap.top(%{"b" => 1, "a" => 1}, 2) == [{"a", 1}, {"b", 1}] # => tie broken by name.
  end # => the ranking test closes.
end # => the suite module closes.
# => The gate reads the summary as data; red suites stop the report cold.
stats = ExUnit.run() # => run returns the summary map, prints nothing.
true = stats.failures == 0 # => the gate: zero failures or no report.
# => Loud boundary: a missing input file reports to stderr and exits nonzero.
case File.read(Path.join(__DIR__, "input.txt")) do # => read the eight-line fixture.
  {:ok, body} -> # => the present-file branch.
    lines = String.split(body, "\n", trim: true) # => split into non-empty lines.
    counts = LogCap.summarize(lines) # => count by level.
    top3 = LogCap.top(counts, 3) # => rank the top three.
    # => The sample lock declares the closure pins; this project needs none.
    {pins, _} = Path.join(__DIR__, "sample.mix.lock") |> Code.eval_file() # => read the pin declaration.
    # => The side report lands under /tmp; stdout stays the asserted transcript.
    report = top3 |> Enum.map(fn {level, c} -> "#{level}: #{c}" end) |> Enum.join("\n") # => one level-count line each.
    File.write!(Path.join(System.tmp_dir!(), "elixir-in-depth-capstone-report.txt"), report <> "\n") # => the /tmp side report.
    IO.puts("suite: #{stats.total} tests, #{stats.failures} failures") # => the suite summary line.
    IO.puts("lines=#{length(lines)} levels=#{map_size(counts)}") # => the headline totals line.
    IO.puts("pins=#{map_size(pins)} stdlib-only") # => the pin declaration line.
    IO.puts(report) # => the ranked top three.
  {:error, reason} -> # => the missing-file branch.
    IO.puts(:stderr, "missing input: #{:file.format_error(reason)}") # => the loud stderr message.
    System.halt(1) # => nonzero exit; silence is not an option.
end # => the case closes; one path ran.
