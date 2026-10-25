# => Example 71: a pipeline read in evaluation order.
# => Inside-out reading follows evaluation: innermost first.
# => Stage outputs are checkpoints: predict each before running.
# => Dirty rows drop at the filter: validation precedes conversion.
# => Lists here are small: generators take over at volume.
raw = ["ada:98", "grace:xx", "margaret:100"]  # => name:score rows, one dirty

parsed = [row.split(":") for row in raw]  # => WHY stage one: each row to a pair
print(parsed[1])  # => Output: ['grace', 'xx'], shape before filtering
clean = [
    (name, int(score)) for name, score in parsed if score.isdigit()
]  # => WHY stage two: validate plus convert
print(clean)  # => Output: [('ada', 98), ('margaret', 100)], dirty row gone
report = [
    f"{name}={score}" for name, score in clean
]  # => WHY stage three: format pairs
print(report)  # => Output: ['ada=98', 'margaret=100'], predict then verify
