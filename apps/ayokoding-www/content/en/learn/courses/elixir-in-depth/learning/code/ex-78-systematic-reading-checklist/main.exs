# => Example 78: the five-step reading method, applied to one sample.
# => The sample is a heredoc so the checklist dissects text, not live code.
sample = """
defmodule Cart do
  def total(items), do: Enum.sum(items)
end
"""
# => Step one names the unit kind: a module with one public function.
kind = if String.contains?(sample, "defmodule"), do: "module", else: "script" # => defmodule present means module.
# => Step two counts the public surface: def lines at two-space indent.
pubs = sample |> String.split("\n") |> Enum.filter(fn l -> String.starts_with?(l, "  def ") end) |> length() # => exactly one surface line.
# => Step three notes the dependencies: capitalized aliases and module calls.
uses_enum = String.contains?(sample, "Enum.") # => Enum dot-call means an Enum dependency.
# => Steps four and five state the data flow and the open question, if any.
IO.puts("kind=#{kind} public=#{pubs} uses_enum=#{uses_enum} flow=list in, number out") # => the one-line reading report.
