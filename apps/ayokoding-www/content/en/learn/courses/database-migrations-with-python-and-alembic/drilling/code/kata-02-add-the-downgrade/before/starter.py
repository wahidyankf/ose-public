# => Kata 2 starter: a revision with no way back.
import os  # => WHY os: tempdir plus pg vars
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic import command  # => WHY command: run the upgrade
from alembic.config import Config  # => WHY Config: no ini file
from sqlalchemy import create_engine  # => WHY engine: direct checks


def main():  # => upgrades fine, then rollback is a dead end
    sdir = tempfile.mkdtemp(prefix="kata02-")  # => WHY temp: scratch script dir
    vdir = os.path.join(sdir, "versions")  # => Alembic reads this subdir
    os.makedirs(vdir)  # => create before writing
    with open(
        os.path.join(vdir, "k02a1_up.py"), "w"
    ) as handle:  # => one lonely revision
        handle.write('"""kata02 gadgets."""\n')  # => human-readable doc
        handle.write("from alembic import op\n")  # => DDL verbs
        handle.write("import sqlalchemy as sa\n")  # => column types
        handle.write("revision = 'k02a1'\n")  # => fixed id
        handle.write("down_revision = None\n")  # => first in chain
        handle.write("def upgrade():\n")  # => forward step exists
        handle.write("    op.create_table('kata02_gadgets',\n")  # => creates the table
        handle.write(
            "        sa.Column('id', sa.Integer(), primary_key=True))\n"
        )  # => bare key
        handle.write("def downgrade():\n")  # => reverse step missing
        handle.write(
            "    pass  # => NOTHING to run: rollback is a dead end\n"
        )  # => the smell
    print("upgraded: True")  # => forward works
    print("downgrade: pass  # nothing to run")  # => backward is a lie
    shutil.rmtree(sdir, ignore_errors=True)  # => scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
