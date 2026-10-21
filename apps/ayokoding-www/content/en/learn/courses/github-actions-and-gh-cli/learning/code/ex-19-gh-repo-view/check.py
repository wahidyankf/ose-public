# => Offline simulator for a gh repo command over a fixture.
# => Fixture mirrors the gh repo view --json shape on 2026-10-20.
# => No gh binary and no network; reads repo.json only.
# => WHY fixtures: repository state is frozen, assertions stay stable.
# => Field names follow the live JSON keys so skills transfer.
import json  # => parse the frozen fixture file
from pathlib import Path  # => locate the fixture beside this script


HERE = Path(__file__).resolve().parent  # => unit directory itself


def load():  # => read the frozen repository fixture
    text = (HERE / "repo.json").read_text(encoding="utf-8")  # => raw bytes
    return json.loads(text)  # => parsed fixture dict


def main():  # => print the fields a human checks before cloning
    repo = load()  # => frozen repository record
    print("repo:", repo["owner"] + "/" + repo["name"])  # => full name
    print("visibility:", repo["visibility"])  # => public or private
    print("branch:", repo["defaultBranch"])  # => branch to clone
    print("issues:", repo["openIssues"])  # => open issue count
    print("stars:", repo["stars"])  # => watcher interest signal
    print("clone:", repo["cloneUrl"] is not None)  # => URL present


main()  # => run once; a missing field fails with KeyError
