# => Kata reference: one lane per branch, newest push wins.
# => Checked against the vendor concurrency docs on 2026-10-20.
# => GROUP keys on github.ref so branches never cancel each other.
# => CANCEL true trades partial logs for one current signal.

# => WHY this shape: stale runs bill minutes to test abandoned code.
# => Keying on ref isolates branches; a constant key would cross-cancel.
# => Test lanes cancel; deploy lanes queue: know which file this is.
GROUP = "ci-${{ github.ref }}"  # => one lane per branch
CANCEL = True  # => newest push cancels the stale run


def lane(group, cancel):  # => True when the lane is safe and live
    keyed = "github.ref" in group  # => isolated per branch
    return keyed and cancel is True  # => both must hold


def main():  # => print the lane and the policy verdict
    print("group:", GROUP)  # => Output: the lane expression
    print("cancel:", CANCEL)  # => Output: True
    print("live:", lane(GROUP, CANCEL))  # => Output: True


main()  # => run once; False means stale runs survive
