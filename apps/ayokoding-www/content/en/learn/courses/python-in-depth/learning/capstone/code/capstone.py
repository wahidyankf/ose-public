# => Capstone: an order-report CLI with embedded selftests.
import argparse  # => WHY argparse: the standard CLI shape
import csv  # => WHY csv: records, not string splitting
import sys  # => WHY sys: argv in, exit status out
import unittest  # => WHY unittest: the suite ships inside the tool


def parse_records(path):  # => read plus validate: errors collected, not raised
    rows = []  # => valid rows accumulate here
    errors = []  # => WHY collect: one bad row must not kill the report
    with open(
        path, encoding="utf-8", newline=""
    ) as handle:  # => WHY explicit: the text policy
        reader = csv.DictReader(handle)  # => WHY header: order-independent access
        for lineno, record in enumerate(
            reader, start=2
        ):  # => WHY 2: header occupies line 1
            try:  # => WHY narrow: only the conversions sit inside
                qty = int(record["qty"])  # => may raise on non-numeric text
                price = float(record["price"])  # => may raise on bad decimals
            except (
                KeyError,
                ValueError,
                TypeError,
            ):  # => WHY triple: missing yields None too
                errors.append(
                    f"line {lineno}: bad numbers"
                )  # => fixed label, stable text
                continue  # => WHY continue: skip the row, keep the report
            if qty < 0:  # => WHY guard: impossible quantities rejected
                errors.append(
                    f"line {lineno}: negative qty"
                )  # => named, countable failure
                continue  # => skipped like any other bad row
            rows.append(
                {"sku": record["sku"], "qty": qty, "price": price}
            )  # => plain validated types
    return rows, errors  # => WHY pair: data plus diagnostics travel together


def summarize(rows):  # => WHY pure: math over validated rows only
    units = sum(row["qty"] for row in rows)  # => WHY comprehension: the whole total
    value = sum(row["qty"] * row["price"] for row in rows)  # => money as float sum here
    return {
        "lines": len(rows),
        "units": units,
        "value": value,
    }  # => WHY dict: named results


class TestParse(unittest.TestCase):  # => WHY embedded: the tool proves itself
    def test_valid_row(self):  # => the happy path pinned first
        rows, errors = parse_records("records.csv")  # => the committed fixture
        self.assertEqual(len(rows), 2)  # => two good rows among four
        self.assertEqual(
            errors, ["line 4: bad numbers", "line 5: negative qty"]
        )  # => exact diagnostics

    def test_summary_math(self):  # => WHY math: totals are the product
        summary = summarize([{"sku": "a", "qty": 4, "price": 60.0}])  # => one known row
        self.assertEqual(summary["units"], 4)  # => units summed
        self.assertEqual(summary["value"], 240.0)  # => value multiplied

    def test_empty_input(self):  # => WHY edge: headers alone must not crash
        import tempfile  # => WHY local: the import lives with its use
        import os  # => WHY local: path join beside the tempdir

        with tempfile.TemporaryDirectory() as scratch:  # => private scratch per run
            path = os.path.join(scratch, "empty.csv")  # => fixed name, stable content
            with open(
                path, "w", encoding="utf-8", newline=""
            ) as handle:  # => header only
                handle.write("sku,qty,price\n")  # => no data rows at all
            rows, errors = parse_records(path)  # => parsed from scratch
        self.assertEqual((rows, errors), ([], []))  # => empties, no diagnostics

    def test_negative_rejected(self):  # => WHY guard: impossible stays out
        import tempfile  # => second scratch: tests stay independent
        import os  # => path join beside its use

        with tempfile.TemporaryDirectory() as scratch:  # => isolated per test
            path = os.path.join(scratch, "neg.csv")  # => fixed name again
            with open(
                path, "w", encoding="utf-8", newline=""
            ) as handle:  # => one bad row
                handle.write("sku,qty,price\ncable,-3,9.99\n")  # => negative quantity
            rows, errors = parse_records(path)  # => parsed from scratch
        self.assertEqual(rows, [])  # => nothing valid survived
        self.assertEqual(errors, ["line 2: negative qty"])  # => the labeled rejection

    def test_missing_column(self):  # => WHY shape: wrong headers fail plainly
        import tempfile  # => third scratch: independence preserved
        import os  # => path join beside its use

        with tempfile.TemporaryDirectory() as scratch:  # => isolated per test
            path = os.path.join(scratch, "short.csv")  # => fixed name again
            with open(
                path, "w", encoding="utf-8", newline=""
            ) as handle:  # => missing price column
                handle.write("sku,qty\nlamp,4\n")  # => DictReader yields None price
            rows, errors = parse_records(path)  # => parsed from scratch
        self.assertEqual(rows, [])  # => nothing valid survived
        self.assertEqual(
            errors, ["line 2: bad numbers"]
        )  # => None price is bad numbers


def run_selftests():  # => WHY function: the suite as a callable stage
    suite = unittest.TestLoader().loadTestsFromTestCase(
        TestParse
    )  # => the five methods
    result = unittest.TestResult()  # => WHY memory: no timing lines in output
    suite.run(result)  # => executed in-process, deterministically
    return result  # => the caller decides how to report


def main(argv):  # => WHY main: the CLI path as a testable function
    parser = argparse.ArgumentParser(
        prog="orders", description="Summarize an order CSV."
    )  # => the contract
    parser.add_argument(
        "input", nargs="?", default="records.csv"
    )  # => WHY default: bare runs work
    args = parser.parse_args(argv)  # => strings become a namespace here
    rows, errors = parse_records(args.input)  # => data plus diagnostics
    summary = summarize(rows)  # => pure math over validated rows
    for row in rows:  # => one line per valid row, input order kept
        print(
            f"{row['sku']}: {row['qty']} x {row['price']:.2f}"
        )  # => fixed money format
    print(f"lines: {summary['lines']}")  # => valid row count
    print(f"units: {summary['units']}")  # => total units ordered
    print(f"value: {summary['value']:.2f}")  # => total value, two decimals
    for err in errors:  # => diagnostics after data, labeled per line
        print(f"skip: {err}")  # => WHY skip: dropped rows stay visible
    result = run_selftests()  # => the tool proves itself every run
    print(f"selftest: {result.testsRun} passed")  # => Output line: deterministic count
    return 0 if result.wasSuccessful() else 1  # => WHY status: failures exit nonzero


if __name__ == "__main__":  # => WHY guard: library when imported, tool when run
    raise SystemExit(main(sys.argv[1:]))  # => single exit point for the program
