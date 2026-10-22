# => Example 4: lists hold terms, binaries hold text; charlists are neither.
nums = [1, 2, 3]
# => Prepending is cheap; appending rebuilds, so idioms prepend then reverse.
nums = [0 | nums]
# => Single-quoted sigil builds a list of codepoints, not a string.
points = ~c"abc"
# => Strings are UTF-8 binaries; byte_size counts bytes, not characters.
text = "héllo"
# => Enum works over lists; String.graphemes bridges binaries into lists.
doubled = Enum.map(nums, fn n -> n * 2 end)
# => Print list membership, text rendering, sizes, and the mapped list.
IO.puts("list?=#{is_list(points)} text=#{List.to_string(points)}")
# => Byte size and grapheme length differ exactly on the accented letter.
IO.puts("bytes=#{byte_size(text)} graphemes=#{String.length(text)} doubled=#{inspect(doubled)}")
