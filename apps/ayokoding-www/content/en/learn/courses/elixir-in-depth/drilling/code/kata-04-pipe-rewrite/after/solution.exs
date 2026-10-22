# => Kata 4 solution: the pipe lists the same transforms in reading order.
raw = "  ada,36  "
# => Each stage names one transform; the data flows down the left edge.
cleaned = raw |> String.trim() |> String.downcase() |> String.split(",")
# => The pipeline reads as the procedure: trim, case-fold, then split.
IO.puts("cleaned=#{inspect(cleaned)}")
