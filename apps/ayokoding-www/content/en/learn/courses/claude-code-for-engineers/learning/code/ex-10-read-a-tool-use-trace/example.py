# => Fixture shim of a tool-use trace summarizer.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => The trace is fixed data; nothing is executed here.
# => Real behaviour may differ; confirm with claude --help.

# => WHY count per tool: the shape reveals the session strategy.
# => First-seen order keeps the summary stable across runs.

TRACE = [
    "read login.py",
    "read auth.py",
    "edit login.py",
    "exec pytest",
]  # => four calls in order


def summarize(trace):  # => count calls per tool, keeping first-seen order
    counts = {}  # => tool name maps to its call count
    for call in trace:  # => walk the trace exactly once, in order
        tool = call.split()[0]  # => the first word names the tool
        counts[tool] = counts.get(tool, 0) + 1  # => bump the running total
    return counts  # => read 2, edit 1, exec 1


def main():  # => print the summary and the raw order
    counts = summarize(TRACE)  # => counts holds three tools
    print("tools:", len(counts))  # => Output: tools: 3
    print("reads:", counts["read"])  # => Output: reads: 2
    print("order:", " > ".join(TRACE))  # => Output: order: the four calls in sequence


main()  # => run once; order above is the whole lesson
