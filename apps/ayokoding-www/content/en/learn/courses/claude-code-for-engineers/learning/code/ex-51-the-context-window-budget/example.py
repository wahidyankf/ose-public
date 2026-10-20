# => Fixture shim budgeting a fixed context window.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Sizes are fixed data; no window exists here.
# => Real behaviour may differ; confirm with claude --help.
WINDOW = 200000  # => the total token budget for this session
CLAIMANTS = {"memory": 20000, "tools": 60000, "chat": 40000}  # => three current claims


def used(claimants):  # => add every claimant's current hold
    return sum(claimants.values())  # => 120000 tokens held here


def free(window, claimants):  # => the headroom left for new reads
    return window - used(claimants)  # => 80000 tokens free here


def fits(window, claimants, request):  # => a read fits when headroom covers it
    return request <= free(window, claimants)  # => True or False, no partial reads


def main():  # => budget the window and test two read sizes
    print("used:", used(CLAIMANTS))  # => Output: used: 120000
    print("free:", free(WINDOW, CLAIMANTS))  # => Output: free: 80000
    print("fits 90000:", fits(WINDOW, CLAIMANTS, 90000))  # => Output: fits 90000: False


main()  # => run once; refuse reads that overflow the budget
