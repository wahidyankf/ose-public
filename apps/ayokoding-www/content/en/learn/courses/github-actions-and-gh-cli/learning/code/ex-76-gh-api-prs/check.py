# => Offline simulator for a gh api call over a fixture.
# => Fixture mirrors the REST pull-list payload shape on 2026-10-20.
# => No gh binary and no network; reads api.json only.
# => WHY fixtures: API payloads are frozen, parsing stays stable.
# => Field paths match the live REST keys so skills transfer.
import json  # => parse the frozen fixture file
from pathlib import Path  # => locate the fixture beside this script


HERE = Path(__file__).resolve().parent  # => unit directory itself
STATE = "open"  # => which pull state this query keeps


def load():  # => read the frozen API payload
    text = (HERE / "api.json").read_text(encoding="utf-8")  # => raw bytes
    return json.loads(text)  # => parsed fixture dict


def main():  # => filter pulls the way the jq query after gh api would
    payload = load()  # => frozen REST payload with an items list
    items = [i for i in payload["items"] if i["state"] == STATE]  # => filter
    items.sort(key=lambda i: i["number"])  # => oldest number first
    for item in items:  # => one line per pull, stable order
        print(item["number"], item["title"] + " @" + item["user"])  # => row
    print("total:", payload["total"], "shown:", len(items))  # => summary


main()  # => run once; the filter mirrors the live jq expression
