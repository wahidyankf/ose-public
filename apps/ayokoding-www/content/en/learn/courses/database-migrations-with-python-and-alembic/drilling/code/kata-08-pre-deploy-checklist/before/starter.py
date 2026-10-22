# => Kata 8 starter: the deploy nobody checked.
import os  # => WHY os: tempdir plus pg vars
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic import command  # => WHY command: run the upgrade
from alembic.config import Config  # => WHY Config: no ini file


def main():  # => head-ward, eyes closed
    sdir = tempfile.mkdtemp(prefix="kata08-")  # => WHY temp: scratch script dir
    vdir = os.path.join(sdir, "versions")  # => Alembic reads this subdir
    os.makedirs(vdir)  # => create before writing
    print("checks: 0")  # => no linearity check
    print("checks: 0  # no currency check")  # => no current-equals-head check
    print("checks: 0  # no fidelity check")  # => no schema-match check
    print("deployed: True  # unchecked")  # => the gamble, printed plainly
    shutil.rmtree(sdir, ignore_errors=True)  # => scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
