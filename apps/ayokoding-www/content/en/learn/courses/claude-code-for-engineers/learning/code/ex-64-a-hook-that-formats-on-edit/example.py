# => Fixture shim of an edit hook that formats touched files.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Hooks are fixed data; no command runs here.
# => Real behaviour may differ; confirm with claude --help.
HOOKS = {"edit": ["format login.py"], "stop": ["notify done"]}  # => one hook per event


def fire(hooks, event):  # => run every command registered for an event
    return list(hooks.get(event, []))  # => the commands for this event


def on_edit(hooks, path):  # => the edit event formats the touched file
    ran = fire(hooks, "edit")  # => the registered edit commands
    return [
        c for c in ran if path in c or "format" in c
    ]  # => commands touching this file


def main():  # => fire edit and stop hooks once each
    print(
        "on edit:", on_edit(HOOKS, "login.py")
    )  # => Output: on edit: ['format login.py']
    print("on stop:", fire(HOOKS, "stop"))  # => Output: on stop: ['notify done']


main()  # => run once; hooks automate the boring guarantees
