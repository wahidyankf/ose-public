# => Kata 3 solution: one edit turns two roots into a chain.
import os  # => WHY os: tempdir paths
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic.config import Config  # => WHY Config: no ini file
from alembic.script import ScriptDirectory  # => WHY ScriptDirectory: read history


def write_rev(vdir, rev, down):  # => down links the chain
    down_repr = (
        "None" if down is None else f"'{down}'"
    )  # => WHY repr: base is bare None
    with open(
        os.path.join(vdir, f"{rev}_thing.py"), "w"
    ) as handle:  # => id-prefixed file
        handle.write('"""kata03 thing."""\n')  # => human-readable doc
        handle.write("from alembic import op\n")  # => DDL verbs
        handle.write("import sqlalchemy as sa\n")  # => column types
        handle.write(f"revision = '{rev}'\n")  # => fixed id
        handle.write(f"down_revision = {down_repr}\n")  # => the link under repair
        handle.write("def upgrade():\n")  # => forward step
        handle.write("    pass\n")  # => history shape is the lesson here
        handle.write("def downgrade():\n")  # => reverse step
        handle.write("    pass\n")  # => symmetric no-op


def count_heads(sdir):  # => fresh read every time
    cfg = Config()  # => drive Alembic without ini
    cfg.set_main_option("script_location", sdir)  # => scratch scripts
    return len(ScriptDirectory.from_config(cfg).get_heads())  # => count the tips


def main():  # => fork first, then the one-line fix
    sdir = tempfile.mkdtemp(prefix="kata03-")  # => WHY temp: scratch script dir
    vdir = os.path.join(sdir, "versions")  # => Alembic reads this subdir
    os.makedirs(vdir)  # => create before writing
    write_rev(vdir, "k03a1", None)  # => first root
    write_rev(vdir, "k03b1", None)  # => second root, unlinked
    before = count_heads(sdir)  # => TWO tips before the fix
    write_rev(vdir, "k03b1", "k03a1")  # => THE fix: point at the parent
    after = count_heads(sdir)  # => ONE tip after the fix
    print(f"before: {before}")  # => Output line: the fork, counted
    print(f"after: {after}")  # => Output line: the chain, restored
    print("kata ok")  # => Output line: one edit, one history
    shutil.rmtree(sdir, ignore_errors=True)  # => scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
