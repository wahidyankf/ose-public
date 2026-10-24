# => Fixture shim of interactive session startup.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Models startup order only; no real conversation happens here.
# => Real behaviour may differ; confirm with claude --help.

# => WHY startup order: memory before greeting shapes answers.
# => A broken config shows here, not mid-task.
# => Naming now pays off in the resume picker later.
# => The transcript slot opens before the first turn.
# => Tidy startup state compounds across the session.
# => Startup is the agent reading the room.

STARTUP = [
    "load project memory",
    "load user settings",
    "open transcript",
]  # => startup in fixed order


class Session:  # => a tiny stand-in for one live conversation
    def __init__(self, name):  # => a session starts with a name and nothing else
        self.name = name  # => the name appears in resume pickers later
        self.turns = []  # => turns accumulate as the conversation grows


def greet(session):  # => build the greeting from what startup loaded
    loaded = len(STARTUP)  # => loaded is 3, one per startup step
    session.turns.append("hello")  # => the greeting becomes turn one
    return "%s ready (%d sources loaded)" % (
        session.name,
        loaded,
    )  # => one status line back


def main():  # => start a session and show its first state
    session = Session("first-look")  # => a fresh session named first-look
    print(
        "startup:", ", ".join(STARTUP)
    )  # => Output: startup: the three steps in order
    print(greet(session))  # => Output: first-look ready (3 sources loaded)
    print("turns:", len(session.turns))  # => Output: turns: 1


main()  # => run startup once; order above is the contract
