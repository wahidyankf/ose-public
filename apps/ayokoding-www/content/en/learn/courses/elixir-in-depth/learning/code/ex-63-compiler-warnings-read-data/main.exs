# => Example 63: unused variables warn; the diagnostic names line and column.
source = "x = 1\ny = 2\ny\n"
# => with_diagnostics captures compiler output as data, not terminal text.
{_modules, diagnostics} = Code.with_diagnostics(fn -> Code.compile_string(source) end)
# => Filter to warnings; errors would raise out of compile_string instead.
warnings = Enum.filter(diagnostics, fn d -> d.severity == :warning end)
# => The first diagnostic pinpoints the unused variable and its position.
first = hd(warnings)
# => Positions are line-column tuples, exact enough to jump to in an editor.
{line, col} = first.position
# => The message names the variable; the position names the exact spot.
IO.puts("warnings=#{length(warnings)} line=#{line} col=#{col} unused=#{String.contains?(first.message, "\"x\"")}")
