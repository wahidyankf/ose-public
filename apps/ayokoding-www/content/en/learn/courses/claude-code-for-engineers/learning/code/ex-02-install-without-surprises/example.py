# => Fixture shim of the Claude Code install decision tree.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Models documented install routes only, never downloads anything.
# => Real behaviour may differ; confirm with claude --help.

# => WHY a matrix: one row per system keeps every route tested.
# => Orphaned install lines rot first because nobody owns them.
# => The version printout is the install receipt; keep it.
# => Native script, cask, and WinGet cover the real fleet.
# => Decision order is system first, manager second, always.
# => Verification beats documentation for install claims.
# => New machines follow the matrix without asking for help.

NATIVE = "curl -fsSL https://claude.ai/install.sh | bash"  # => macOS, Linux, WSL route
BREW = "brew install --cask claude-code"  # => Homebrew stable-channel route
WINGET = "winget install Anthropic.ClaudeCode"  # => Windows WinGet route


def pick(system, manager):  # => choose one install command for a machine
    if system == "windows":  # => Windows never uses the shell script
        return WINGET  # => WinGet carries the native Windows build
    if manager == "brew":  # => macOS with Homebrew prefers the cask
        return BREW  # => the cask tracks the stable channel
    return NATIVE  # => every other Unix takes the shell installer


def verify(step):  # => model the post-install proof, step by step
    checks = [
        "binary on PATH",
        "claude --version prints a number",
    ]  # => two facts prove an install
    done = [c for c in checks if c != step]  # => drop the step still missing
    return done  # => the finished checks come back as a list


def main():  # => walk three machines through install and proof
    for system, manager in [
        ("macos", "brew"),
        ("linux", "none"),
    ]:  # => two Unix setups to compare
        print(
            system, "->", pick(system, manager)
        )  # => Output: the chosen command per system
    print(
        "windows ->", pick("windows", "none")
    )  # => Output: windows -> the WinGet command
    print("verified:", verify("none missing"))  # => Output: verified: both proof checks


main()  # => run the matrix; every branch above is exercised
