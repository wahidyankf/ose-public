# => Offline secret-reference checker for the environment-secrets workflow.
# => Checked against the vendor secrets-context docs on 2026-10-20.
# => DECLARED lists every secret the course text provisions.
# => No values are read here; only ${{ secrets.NAME }} references.
# => WHY scan offline: an undeclared secret fails at 3am, not at review.
# => Masking is assumed; this check proves declaration, never content.
from pathlib import Path  # => locate the data file beside this script
import re  # => find every secrets.NAME reference


HERE = Path(__file__).resolve().parent  # => unit directory itself
DECLARED = ["DEPLOY_TOKEN"]  # => secrets provisioned for this workflow
REF = re.compile(r"secrets\.([A-Z][A-Z0-9_]*)")  # => reference pattern


def main():  # => list every reference and flag the undeclared ones
    text = (HERE / "workflow.yaml").read_text(encoding="utf-8")  # => raw yaml
    used = sorted(set(REF.findall(text)))  # => unique referenced names
    for name in used:  # => one line per reference, stable order
        state = "declared" if name in DECLARED else "UNDECLARED"  # => verdict
        print(name + ":", state)  # => Output: reference status
    print("refs:", len(used), "declared:", len(DECLARED))  # => summary
    print("clean:", all(n in DECLARED for n in used))  # => True means safe


main()  # => run once; UNDECLARED means provision it before pushing
