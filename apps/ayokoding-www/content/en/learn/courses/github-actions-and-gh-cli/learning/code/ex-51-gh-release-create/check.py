# => Offline simulator for a gh release command over a fixture.
# => Fixture mirrors the gh release view --json shape on 2026-10-20.
# => No gh binary and no network; reads release.json only.
# => WHY fixtures: tag state is frozen, assertions stay stable.
# => Asset names and sizes replay byte-identically every run.
import json  # => parse the frozen fixture file
from pathlib import Path  # => locate the fixture beside this script


HERE = Path(__file__).resolve().parent  # => unit directory itself
TAG = "v1.4.0"  # => tag this release run cuts


def load():  # => read the frozen release record
    text = (HERE / "release.json").read_text(encoding="utf-8")  # => raw bytes
    return json.loads(text)  # => parsed fixture dict


def notes_for(release):  # => first line of notes is the headline
    first = release["notes"].splitlines()[0]  # => headline only
    return first  # => short enough for a listing


def main():  # => prove the recorded release matches the intended tag
    rel = load()  # => the release that creation would return
    print("tag:", rel["tag"])  # => Output: the created tag
    print("match:", rel["tag"] == TAG)  # => True when tags agree
    print("headline:", notes_for(rel))  # => Output: notes headline
    print("assets:", len(rel["assets"]))  # => files attached at upload


main()  # => run once; tag mismatch fails the match line
