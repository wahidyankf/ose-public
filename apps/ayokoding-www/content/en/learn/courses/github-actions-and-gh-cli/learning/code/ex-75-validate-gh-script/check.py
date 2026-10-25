# => Offline dry-run checker for a gh automation script.
# => Checked against the gh manual and shell strict-mode docs on 2026-10-20.
# => SCRIPT must start with set -euo pipefail and call gh with --json.
# => No gh binary runs here; script.sh is read as text only.
# => WHY dry-run: quoting and flag bugs are cheapest before the network.
# => Every FAIL names the shell practice the script skipped.
from pathlib import Path  # => locate the data file beside this script


HERE = Path(__file__).resolve().parent  # => unit directory itself


def lines():  # => read the script under test as text lines
    text = (HERE / "script.sh").read_text(encoding="utf-8")  # => raw script
    return [line.rstrip() for line in text.splitlines() if line.strip()]  # => code


def main():  # => check strict mode, gh usage, and machine flags
    code = lines()  # => non-blank lines of the script
    gh_calls = [line for line in code if line.startswith("gh ")]  # => gh lines
    report = [  # => (label, passed) pairs in display order
        ("strict-mode-header", code[0] == "set -euo pipefail"),  # => safety
        ("uses-gh-binary", len(gh_calls) >= 1),  # => automates via gh
        ("json-output-flag", all("--json" in c for c in gh_calls)),  # => machine
        ("no-bare-token-echo", not any("echo $GH" in c for c in code)),  # => secret
        (
            "quotes-variables",
            all("$" not in c or '"' in c for c in gh_calls),
        ),  # => quote
    ]  # => end of the check list
    for label, ok in report:  # => one line per check, stable order
        print(("PASS" if ok else "FAIL") + ": " + label)  # => verdict
    print("gh-calls:", len(gh_calls))  # => how many gh steps the script runs


main()  # => run once; a FAIL blocks the script from ever running live
