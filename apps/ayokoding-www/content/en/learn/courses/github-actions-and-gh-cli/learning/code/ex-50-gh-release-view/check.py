# => Offline simulator for a gh release command over a fixture.
# => Fixture mirrors the gh release view --json shape on 2026-10-20.
# => No gh binary and no network; reads release.json only.
# => WHY fixtures: tag state is frozen, assertions stay stable.
# => Asset names and sizes replay byte-identically every run.
import json  # => parse the frozen fixture file
from pathlib import Path  # => locate the fixture beside this script


HERE = Path(__file__).resolve().parent  # => unit directory itself


def load():  # => read the frozen release record
    text = (HERE / "release.json").read_text(encoding="utf-8")  # => raw bytes
    return json.loads(text)  # => parsed fixture dict


def main():  # => print the fields a releaser verifies first
    rel = load()  # => frozen release record
    print("tag:", rel["tag"])  # => Output: the release tag
    print("name:", rel["name"])  # => Output: the release title
    print("draft:", rel["draft"], "prerelease:", rel["prerelease"])  # => flags
    for asset in rel["assets"]:  # => one line per attached file
        print("asset:", asset["name"], asset["size"])  # => name and bytes
    print("downloads:", sum(a["downloads"] for a in rel["assets"]))  # => total


main()  # => run once; asset bytes replay identically every run
