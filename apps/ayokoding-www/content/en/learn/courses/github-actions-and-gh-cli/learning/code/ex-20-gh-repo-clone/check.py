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


def plan(repo):  # => derive the clone steps from the fixture
    steps = ["clone " + repo["cloneUrl"]]  # => first fetch the objects
    steps.append("checkout " + repo["defaultBranch"])  # => then the branch
    return steps  # => ordered, deterministic plan


def main():  # => print the offline clone plan, nothing executes
    repo = load()  # => frozen repository record
    for i, step in enumerate(plan(repo), 1):  # => numbered, stable order
        print("step" + str(i) + ":", step)  # => Output: one plan line
    print("depth:", 1)  # => shallow clone is enough for CI
    print("branch:", repo["defaultBranch"])  # => Output: default branch


main()  # => run once; planning never touches the network
