# => Kata 3 starter: two roots, nobody linked them.
import os  # => WHY os: tempdir paths
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic.config import Config  # => WHY Config: no ini file
from alembic.script import ScriptDirectory  # => WHY ScriptDirectory: read history


def write_rev(vdir, rev):  # => both files claim to be first
    with open(
        os.path.join(vdir, f"{rev}_thing.py"), "w"
    ) as handle:  # => id-prefixed file
        handle.write('"""kata03 thing."""\n')  # => human-readable doc
        handle.write("from alembic import op\n")  # => DDL verbs
        handle.write("import sqlalchemy as sa\n")  # => column types
        handle.write(f"revision = '{rev}'\n")  # => fixed id
        handle.write(
            "down_revision = None  # => SMELL: two roots, no chain\n"
        )  # => nobody linked them
        handle.write("def upgrade():\n")  # => forward step
        handle.write("    pass\n")  # => history shape is the lesson here
        handle.write("def downgrade():\n")  # => reverse step
        handle.write("    pass\n")  # => symmetric no-op


def main():  # => the fork, printed plainly
    sdir = tempfile.mkdtemp(prefix="kata03-")  # => WHY temp: scratch script dir
    vdir = os.path.join(sdir, "versions")  # => Alembic reads this subdir
    os.makedirs(vdir)  # => create before writing
    write_rev(vdir, "k03a1")  # => first root
    write_rev(vdir, "k03b1")  # => second root, unlinked
    cfg = Config()  # => drive Alembic without ini
    cfg.set_main_option("script_location", sdir)  # => scratch scripts
    script = ScriptDirectory.from_config(cfg)  # => read the file history
    print(f"heads: {len(script.get_heads())}")  # => TWO tips: the fork made visible
    print("linked: False")  # => no down_revision points anywhere
    shutil.rmtree(sdir, ignore_errors=True)  # => scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
