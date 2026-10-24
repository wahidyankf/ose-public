# => Kata 5 starter: the rename with no deploy window.
import os  # => WHY os: tempdir plus pg vars
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir


def main():  # => one revision, zero room for old code
    sdir = tempfile.mkdtemp(prefix="kata05-")  # => WHY temp: scratch script dir
    vdir = os.path.join(sdir, "versions")  # => Alembic reads this subdir
    os.makedirs(vdir)  # => create before writing
    with open(
        os.path.join(vdir, "k05a1_rename.py"), "w"
    ) as handle:  # => the single-step rename
        handle.write('"""kata05 rename."""\n')  # => human-readable doc
        handle.write("from alembic import op\n")  # => DDL verbs
        handle.write("import sqlalchemy as sa\n")  # => column types
        handle.write("revision = 'k05a1'\n")  # => fixed id
        handle.write("down_revision = None\n")  # => first in chain
        handle.write("def upgrade():\n")  # => forward step
        handle.write(
            "    op.alter_column('kata05_users', 'name', new_column_name='email')\n"
        )  # => SMELL: old code breaks now
        handle.write("def downgrade():\n")  # => reverse step
        handle.write(
            "    op.alter_column('kata05_users', 'email', new_column_name='name')\n"
        )  # => reverse renames back
    print("revisions: 1")  # => one step does everything
    print(
        "deploy window: none  # old and new code cannot coexist"
    )  # => the missing middle
    shutil.rmtree(sdir, ignore_errors=True)  # => scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
