# => Example 71: read a pipe chain stage by stage, naming each type change.
sample = "grace,85;ada,36"
# => Stage one produces a list of row strings from the raw binary.
stage1 = String.split(sample, ";")
# => Stage two maps rows to name-age pairs, changing the element type.
stage2 = Enum.map(stage1, fn row -> String.split(row, ",") end)
# => Stage three sorts pairs by name, fixing the order for every reader.
stage3 = Enum.sort_by(stage2, fn [name | _] -> name end)
# => The reading method: name each stage's input and output type aloud.
IO.puts("s1=#{inspect(stage1)}")
# => Stages two and three close the story: pairs in, ordered pairs out.
IO.puts("s2=#{inspect(stage2)} s3=#{inspect(stage3)}")
