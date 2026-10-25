# => Example 1 drives no live binary.
# => It replays fixture text shaped like the real CLI output,
# => so the lesson stays runnable years after the release changes.
version_line = "openclaw v2026.10.5"  # => the exact `--version` fixture line we parse below
doctor_lines = ["node 24.11.0 ok", "config file ok", "gateway port ok"]  # => one fixture line per doctor probe the CLI runs
# => three probes keep this first parser tiny and readable
version = version_line.split()[1]  # => split on whitespace and keep the second field
# => version is now v2026.10.5 (type: str)
release = version.lstrip("v")  # => strip the leading v so the release compares as numbers
# => release is now 2026.10.5 (type: str)
parts = [int(p) for p in release.split(".")]  # => split on dots and convert each piece to int
# => parts is now [2026, 10, 5] (type: list)
print("release: " + release)  # => Output: release: 2026.10.5
print("major: %d" % parts[0])  # => Output: major: 2026
checks = {}  # => checks will map each probe name to True or False
for line in doctor_lines:  # => walk the three fixture lines one at a time
    name, _ver, status = line.split()  # => unpack probe name, detail, and trailing status word
    # => status is ok for every fixture line here
    checks[name] = status == "ok"  # => True only when the probe reports ok
    # => checks gains node, then config, then gateway
for name in ["node", "config", "gateway"]:  # => report the probes in a fixed, readable order
    print(name + ": " + str(checks[name]))  # => Output: node: True, then config: True, gateway: True
ready = all(checks.values())  # => all() is True only when every probe passed
# => ready is True, so later examples may proceed
print("ready: " + str(ready))  # => Output: ready: True
