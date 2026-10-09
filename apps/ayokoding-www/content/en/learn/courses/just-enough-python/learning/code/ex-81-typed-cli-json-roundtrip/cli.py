"""Example 81: Fully-typed argparse CLI that reads, transforms, and writes JSON."""

# => The CLI doubles count while preserving the label.

# Defers annotation evaluation (portability, as in Example 68).
from __future__ import annotations  # => defers evaluation on older Python

import argparse  # => imports the standard-library CLI-parsing module
import json  # => imports the standard-library json module
from pathlib import Path  # => imports Path for filesystem-safe path handling
from typing import TypedDict  # => imports TypedDict for a typed, dict-shaped record


# A typed dict SHAPE -- no runtime class, just static structure.
# pyright checks that every dict literal used as a Record has BOTH fields, correctly typed.
class Record(TypedDict):  # => declares the shape { count: int, label: str }
    count: int  # => declares a required int field named count
    label: str  # => declares a required str field named label


def double_count(record: Record) -> Record:  # => pure, no side effects
    return {  # => builds and returns a NEW Record, leaving the input untouched
        "count": record["count"] * 2,  # => doubles the count field
        "label": record["label"],  # => copies the label field unchanged
    }  # => closes the dict literal


def main() -> None:  # => defines the entry point, called only when run directly
    # description shows up at the top of the auto-generated --help text.
    parser = argparse.ArgumentParser(  # => creates the parser
        description="Double the count field in a JSON file.",  # => shown in --help
    )  # => parser now has the CLI help description
    parser.add_argument(
        "input", type=str, help="path to the input JSON file"
    )  # => requires the source JSON path
    # => a required positional argument -- the source file path
    parser.add_argument(  # => adds a second positional argument for output
        "output",  # => the second required positional argument
        type=str,  # => argparse converts the raw string; str is a no-op conversion
        help="path to write the transformed JSON file",  # => help describes the destination path
    )  # => finishes defining the required output path
    args = parser.parse_args()  # => args.input and args.output hold the two paths

    # Path gives filesystem-safe join/read/write methods.
    input_path: Path = Path(args.input)  # => wraps the input string in a Path object
    output_path: Path = Path(args.output)  # => wraps the output string in a Path object

    record: Record = json.loads(input_path.read_text())  # => read + parse in one call
    transformed: Record = double_count(record)  # => applies the pure transform
    output_path.write_text(json.dumps(transformed))  # => serialize + write, one call

    # Re-read to prove the roundtrip worked.
    print(json.loads(output_path.read_text()))  # => the doubled record, as a dict


if __name__ == "__main__":  # => True only when cli.py is run directly, not imported
    main()  # => calls main(), which reads, transforms, and writes the JSON file
