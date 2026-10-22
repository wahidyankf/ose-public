# => Kata 4 starter: nesting reads inside out and hides the order.
raw = "  ada,36  "
# => Three transforms in one expression; the data flow hides inside.
cleaned = String.downcase(String.trim(raw))
# => The nesting works; the reading order fights the execution order.
IO.puts("cleaned=#{cleaned}")
