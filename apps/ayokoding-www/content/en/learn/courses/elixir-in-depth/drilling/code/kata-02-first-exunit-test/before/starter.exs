# => Kata 2 starter: a discount function with no tests pinning it.
discount = fn total -> if total > 100, do: div(total * 9, 10), else: total end
# => The function works; nothing proves it stays working.
IO.puts("large=#{discount.(200)} small=#{discount.(50)}")
