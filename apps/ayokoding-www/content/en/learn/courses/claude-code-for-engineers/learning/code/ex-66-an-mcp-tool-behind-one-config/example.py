# => Fixture shim validating external tool configs.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Configs are fixed data; no server is contacted here.
# => Real behaviour may differ; confirm with claude --help.
TOOLS = {
    "docs": {"transport": "http"},
    "db": {},
}  # => one complete, one missing transport


def valid(config):  # => a tool config must name its transport
    return "transport" in config  # => True only when transport is present


def loadable(tools):  # => split tools into loadable and broken configs
    ok = [n for n, c in tools.items() if valid(c)]  # => docs loads
    broken = [n for n, c in tools.items() if not valid(c)]  # => db waits
    return ok, broken  # => both lists by tool name


def main():  # => validate the two tool configs
    ok, broken = loadable(TOOLS)  # => one loads, one is broken
    print("loads:", ok)  # => Output: loads: ['docs']
    print("broken:", broken)  # => Output: broken: ['db']


main()  # => run once; broken configs fail before sessions start
