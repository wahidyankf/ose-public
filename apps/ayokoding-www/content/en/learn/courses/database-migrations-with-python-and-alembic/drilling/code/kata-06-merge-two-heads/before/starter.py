# => Kata 6 starter: the fork both authors shipped.
import os  # => WHY os: tempdir paths
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic.config import Config  # => WHY Config: no ini file
from alembic.script import ScriptDirectory  # => WHY ScriptDirectory: read history


def write_rev(vdir, rev):  # => two authors, two tips
    with open(
        os.path.join(vdir, f"{rev}_thing.py"), "w"
    ) as handle:  # => id-prefixed file
        handle.write('"""kata06 thing."""\n')  # => human-readable doc
        handle.write("from alembic import op\n")  # => DDL verbs
        handle.write("import sqlalchemy as sa\n")  # => column types
        handle.write(f"revision = '{rev}'\n")  # => fixed id
        handle.write(
            "down_revision = 'k06a1'  # => both children claim the same parent\n"
        )  # => the fork
        handle.write("def upgrade():\n")  # => forward step
        handle.write("    pass\n")  # => history shape is the lesson here
        handle.write("def downgrade():\n")  # => reverse step
        handle.write("    pass\n")  # => symmetric no-op


def main():  # => the fork, counted
    sdir = tempfile.mkdtemp(prefix="kata06-")  # => WHY temp: scratch script dir
    vdir = os.path.join(sdir, "versions")  # => Alembic reads this subdir
    os.makedirs(vdir)  # => create before writing
    with open(os.path.join(vdir, "k06a1_root.py"), "w") as handle:  # => shared root
        handle.write('"""kata06 root."""\n')  # => human-readable doc
        handle.write("revision = 'k06a1'\n")  # => fixed id
        handle.write("down_revision = None\n")  # => chain starts here
        handle.write("def upgrade():\n    pass\n")  # => root carries no DDL
        handle.write("def downgrade():\n    pass\n")  # => symmetric no-op
    write_rev(vdir, "k06b1")  # => first author's tip
    write_rev(vdir, "k06c1")  # => second author's tip
    cfg = Config()  # => drive Alembic without ini
    cfg.set_main_option("script_location", sdir)  # => scratch scripts
    script = ScriptDirectory.from_config(cfg)  # => read the file history
    print(f"heads: {len(script.get_heads())}")  # => TWO tips: deploy cannot pick one
    print("merged: False")  # => no file joins them yet
    shutil.rmtree(sdir, ignore_errors=True)  # => scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
