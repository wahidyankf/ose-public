# => Fixture shim of read-only calls passing without prompts.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Calls are fixed data; no filesystem is read here.
# => Real behaviour may differ; confirm with claude --help.
CALLS = ["read login.py", "grep TODO", "edit login.py"]  # => two reads, one edit


def needs_approval(call, workdir):  # => decide if a call prompts first
    kind, target = call.split(None, 1)  # => split into tool and argument
    if kind in ("read", "grep"):  # => read-only tools stay silent inside
        return not target.startswith(workdir)  # => outside the tree still asks
    return True  # => edits and execs always ask in manual mode


def main():  # => classify two reads and one edit
    print("read:", needs_approval(CALLS[0], ""))  # => Output: read: False
    print("grep:", needs_approval(CALLS[1], ""))  # => Output: grep: False
    print("edit:", needs_approval(CALLS[2], ""))  # => Output: edit: True


main()  # => run once; silence is scoped, not blanket
