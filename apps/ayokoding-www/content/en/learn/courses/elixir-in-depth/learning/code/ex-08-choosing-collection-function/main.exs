# => Example 8: choose the Enum function by the shape of the question.
rows = ["ada", "grace", "alan", "ada"]
# => Membership is a MapSet question, not a linear scan.
present = rows |> MapSet.new() |> MapSet.member?("grace")
# => find stops at the first match; filter would walk the whole list.
first_long = Enum.find(rows, fn r -> String.length(r) > 3 end)
# => frequencies counts in one pass instead of grouping then counting.
counts = Enum.frequencies(rows)
# => any? and all? answer boolean questions without building lists.
has_alan = Enum.any?(rows, fn r -> r == "alan" end)
# => Capture references keep one-line predicates readable.
all_text = Enum.all?(rows, &is_binary/1)
# => Print the membership, search, predicate, and count answers.
IO.puts("present=#{present} first=#{first_long} alan=#{has_alan} all_text=#{all_text}")
# => The duplicate name counted twice; singletons count once.
IO.puts("ada_count=#{Map.get(counts, "ada")} alan_count=#{Map.get(counts, "alan")}")
