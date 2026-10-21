# => Offline simulator for gh auth status over a fixture.
# => Fixture mirrors the gh auth status output shape on 2026-10-20.
# => No gh binary and no token; reads auth.json only.
# => WHY fixtures: credentials never enter the harness, by design.
# => Token values stay redacted even in this frozen copy.
import json  # => parse the frozen fixture file
from pathlib import Path  # => locate the fixture beside this script


HERE = Path(__file__).resolve().parent  # => unit directory itself
LOGIN = "octocat"  # => account the fixture was recorded for
HOST = "example.com"  # => no real hostname is contacted here
WANT = ["repo", "workflow"]  # => scopes this course flow needs


def load():  # => read the frozen auth fixture
    text = (HERE / "auth.json").read_text(encoding="utf-8")  # => raw bytes
    return json.loads(text)  # => parsed fixture dict


def main():  # => prove the recorded login covers the needed scopes
    auth = load()  # => frozen credential report, token redacted
    print("host:", auth["hostname"])  # => Output: the recorded host
    print("user:", auth["user"])  # => Output: the recorded login
    print("match:", auth["user"] == LOGIN)  # => Output: login as expected
    have = set(auth["tokenScopes"])  # => scopes the fixture grants
    missing = [s for s in WANT if s not in have]  # => gaps, if any
    print("scopes:", ",".join(sorted(have)))  # => Output: granted scopes
    print("missing:", ",".join(missing) if missing else "none")  # => gaps
    print("ready:", auth["active"] and not missing)  # => usable or not


main()  # => run once; missing scopes fail the flow loudly
