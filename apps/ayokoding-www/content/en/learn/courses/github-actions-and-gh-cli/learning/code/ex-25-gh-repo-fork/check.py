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


def main():  # => derive the fork name and prove it differs
    repo = load()  # => frozen upstream record
    fork = repo["forkOwner"] + "/" + repo["name"]  # => your copy's name
    print("upstream:", repo["owner"] + "/" + repo["name"])  # => source
    print("fork:", fork)  # => Output: the copy under your login
    print("same:", fork == repo["owner"] + "/" + repo["name"])  # => False
    print("sync:", repo["defaultBranch"])  # => branch that stays synced


main()  # => run once; forking never runs here, only the naming
