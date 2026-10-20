# => Fixture shim rendering a session post-mortem.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Session facts are fixed data; no review happens here.
# => Real behaviour may differ; confirm with claude --help.
TRIED = ["wide scope", "narrow scope"]  # => the two approaches attempted
WORKED = "narrow scope"  # => the approach that landed


def render(tried, worked):  # => build the post-mortem as three lines
    lines = ["tried: " + ", ".join(tried)]  # => the honest attempt list
    lines.append("worked: " + worked)  # => the approach that landed
    lines.append("rule: scope narrow first")  # => the inheritable rule
    return lines  # => the compact post-mortem


def main():  # => render one post-mortem and count its lines
    lines = render(TRIED, WORKED)  # => three post-mortem lines
    for line in lines:  # => print each line
        print(line)  # => Output: tried, worked, and rule lines
    print("lines:", len(lines))  # => Output: lines: 3


main()  # => run once; write the post-mortem before closing the terminal
