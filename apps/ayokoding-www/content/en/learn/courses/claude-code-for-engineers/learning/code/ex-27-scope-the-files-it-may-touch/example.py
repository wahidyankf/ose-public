# => Fixture shim intersecting edits with a file allow-list.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Paths are fixed data; no file is opened here.
# => Real behaviour may differ; confirm with claude --help.
ALLOWED = ["login.py", "auth.py"]  # => the brief names two files
PROPOSED = ["login.py", "settings.py"]  # => the agent reaches for two


def trespass(proposed, allowed):  # => return edits outside the allow-list
    return [f for f in proposed if f not in allowed]  # => settings.py stands out


def inside(proposed, allowed):  # => return the edits the brief covers
    return [f for f in proposed if f in allowed]  # => login.py stays


def main():  # => report the split between inside and outside
    print("inside:", inside(PROPOSED, ALLOWED))  # => Output: inside: ['login.py']
    print(
        "trespass:", trespass(PROPOSED, ALLOWED)
    )  # => Output: trespass: ['settings.py']


main()  # => run once; trespassers need a new approval
