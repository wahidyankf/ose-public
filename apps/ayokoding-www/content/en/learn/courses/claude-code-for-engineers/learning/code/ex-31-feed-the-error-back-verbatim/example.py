# => Fixture shim comparing paraphrased versus verbatim errors.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Errors are fixed data; nothing raises here.
# => Real behaviour may differ; confirm with claude --help.
PARA = "login is broken"  # => the paraphrase keeps zero facts
VERBATIM = (
    "AssertionError: expected 403, got 200 at test_login.py:41"  # => file, line, values
)


def facts(text):  # => count the checkable facts a message carries
    digits = sum(c.isdigit() for c in text)  # => numbers hint at lines and codes
    return digits  # => paraphrase scores near zero


def keep(message):  # => choose the message worth sending back
    return len(message) > 20  # => detail survives; slogans do not


def main():  # => score both messages and pick the keeper
    print("para facts:", facts(PARA))  # => Output: para facts: 0
    print("verbatim facts:", facts(VERBATIM))  # => Output: verbatim facts: 9
    print("send verbatim:", keep(VERBATIM))  # => Output: send verbatim: True


main()  # => run once; paste tracebacks, not summaries
