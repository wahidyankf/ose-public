# => Kata reference: the test context gates the merge.
# => Checked against the vendor branch-protection docs on 2026-10-20.
# => PROTECTION mirrors the required_status_checks contexts list.
# => One membership test is the whole gate; keep it that simple.

# => WHY this shape: protection compares exact strings, not intentions.
# => The job name and the context must match character for character.
# => Required means red blocks; optional means red advises.
PROTECTION = {"required": ["test"]}  # => the test context is required
CHECK = "test"  # => the job name this kata protects


def gates(protection, check):  # => True when the check is required
    return check in protection["required"]  # => exact string membership


def main():  # => print the required list and the gate verdict
    print("required:", ",".join(PROTECTION["required"]))  # => contexts
    print("gates:", gates(PROTECTION, CHECK))  # => Output: True
    print("merge-on-red:", not gates(PROTECTION, CHECK))  # => False


main()  # => run once; False here means the gate is missing
