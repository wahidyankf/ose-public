"""Capstone: app.__main__ -- the argparse CLI entry point (`python3 -m app`).

Reads an inventory JSON file, validates and summarizes it via app.transform, then
writes and prints the resulting summary JSON. A validation failure is caught here
and reported as a clean one-line message with a non-zero exit code, never a raw
traceback -- the CLI's whole job is translating transform.py's exceptions into
something a terminal user can act on.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# A cross-module import within the SAME package (Example 64's shape).
from app.transform import (
    InvalidRecordError,
    InventoryRecord,
    grand_total,
    summarize,
    validate_records,
)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Summarize an inventory JSON file's total value per item."
    )
    parser.add_argument("input", type=str, help="path to the input inventory JSON file")
    parser.add_argument("output", type=str, help="path to write the summary JSON file")
    # Example 61's argparse pattern, with two positionals instead of one.
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    try:
        # json.load returns untrusted data; a type hint alone cannot validate it.
        with input_path.open(encoding="utf-8") as f:
            raw_records: object = json.load(f)
    except OSError as err:
        print(f"cannot read input: {err}", file=sys.stderr)
        return 1
    except json.JSONDecodeError as err:
        print(f"invalid JSON: {err.msg} at line {err.lineno}", file=sys.stderr)
        return 1
    except UnicodeError as err:
        print(f"cannot decode input: {err}", file=sys.stderr)
        return 1

    try:
        records: list[InventoryRecord] = validate_records(raw_records)
        summary = summarize(records)
        payload = {"items": summary, "grand_total": grand_total(summary)}
        # Strict JSON rejects NaN and Infinity before opening the output file.
        serialized = json.dumps(payload, allow_nan=False)
    except InvalidRecordError as err:
        # Example 65's custom-exception-class pattern: a clean message, not a raw traceback.
        print(f"invalid inventory data: {err}", file=sys.stderr)
        return 1
    except ValueError as err:
        print(f"invalid inventory data: {err}", file=sys.stderr)
        return 1

    try:
        with output_path.open("w", encoding="utf-8") as f:
            f.write(serialized)
    except OSError as err:
        print(f"cannot write output: {err}", file=sys.stderr)
        return 1

    # Echoes the same payload to stdout for the caller to see.
    print(serialized)
    return 0


# Example 46's guard -- app.__main__ only runs main() when invoked directly
# (e.g. via `python3 -m app`), never when merely imported.
if __name__ == "__main__":
    raise SystemExit(main())
