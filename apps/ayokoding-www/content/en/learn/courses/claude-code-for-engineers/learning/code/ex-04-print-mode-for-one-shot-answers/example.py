# => Fixture shim of print mode: one query in, one answer out.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Models the exit contract only; no model is consulted here.
# => Real behaviour may differ; confirm with claude --help.
QUERY = "what does retry do"  # => the one question print mode answers
SNIPPET = "def retry(n): return n"  # => the file content under discussion


def answer(query, snippet):  # => produce the single-shot reply text
    words = len(snippet.split())  # => words is 5 for this snippet
    return "answer to %r: %d words seen" % (query, words)  # => one line, no follow-up


def run_print(query, snippet):  # => model exit code plus printed answer
    text = answer(query, snippet)  # => compute the reply before printing
    print(text)  # => Output: answer to 'what does retry do': 5 words seen
    return 0  # => exit 0 means the answer completed


def main():  # => ask once, check the exit, move on
    code = run_print(QUERY, SNIPPET)  # => code is 0 on a finished answer
    print("exit:", code)  # => Output: exit: 0


main()  # => run print mode once; scripts branch on that exit code
