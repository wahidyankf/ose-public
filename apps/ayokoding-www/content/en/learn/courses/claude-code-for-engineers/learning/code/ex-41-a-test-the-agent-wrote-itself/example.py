# => Fixture shim grading generated tests by mutation.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Test bodies are fixed data; nothing executes here.
# => Real behaviour may differ; confirm with claude --help.
TEST = "assert login('a', 'wrong') is False"  # => a test with a real expectation
TAUTOLOGY = "assert True"  # => a test that passes against anything


def kills(test, broken):  # => a good test fails when the code breaks
    return "login" in test and broken  # => the real test names the behavior


def grade(test):  # => grade a generated test as strong or tautology
    if test.strip() == "assert True":  # => unconditional pass is worthless
        return "tautology"  # => it proves nothing about the code
    return "strong"  # => expectations about behavior earn trust


def main():  # => grade one strong test and one tautology
    print("real test:", grade(TEST))  # => Output: real test: strong
    print("tautology:", grade(TAUTOLOGY))  # => Output: tautology: tautology
    print("kills mutant:", kills(TEST, True))  # => Output: kills mutant: True


main()  # => run once; trust tests that can fail
