# => Kata 6 solution: a merge file joins the two tips.
import os  # => WHY os: tempdir paths
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic.config import Config  # => WHY Config: no ini file
from alembic.script import ScriptDirectory  # => WHY ScriptDirectory: read history


def write_rev(vdir, rev, down):  # => down may be a pair for merges
    if isinstance(down, tuple):  # => WHY tuple: two parents, one file
        down_repr = f"('{down[0]}', '{down[1]}')"  # => merge shape
    elif down is None:  # => chain root
        down_repr = "None"  # => bare None, not quoted
    else:  # => ordinary child
        down_repr = f"'{down}'"  # => single parent, quoted
    with open(
        os.path.join(vdir, f"{rev}_thing.py"), "w"
    ) as handle:  # => id-prefixed file
        handle.write('"""kata06 thing."""\n')  # => human-readable doc
        handle.write("from alembic import op\n")  # => DDL verbs
        handle.write("import sqlalchemy as sa\n")  # => column types
        handle.write(f"revision = '{rev}'\n")  # => fixed id
        handle.write(f"down_revision = {down_repr}\n")  # => the parentage under repair
        handle.write("def upgrade():\n")  # => forward step
        handle.write(
            "    pass  # => merges carry no DDL: history only\n"
        )  # => WHY empty: join, not change
        handle.write("def downgrade():\n")  # => reverse step
        handle.write("    pass\n")  # => symmetric no-op


def count_heads(sdir):  # => fresh read every time
    cfg = Config()  # => drive Alembic without ini
    cfg.set_main_option("script_location", sdir)  # => scratch scripts
    return len(ScriptDirectory.from_config(cfg).get_heads())  # => count the tips


def main():  # => fork first, merge second
    sdir = tempfile.mkdtemp(prefix="kata06-")  # => WHY temp: scratch script dir
    vdir = os.path.join(sdir, "versions")  # => Alembic reads this subdir
    os.makedirs(vdir)  # => create before writing
    write_rev(vdir, "k06a1", None)  # => shared root
    write_rev(vdir, "k06b1", "k06a1")  # => first author's tip
    write_rev(vdir, "k06c1", "k06a1")  # => second author's tip
    before = count_heads(sdir)  # => TWO tips before the merge
    write_rev(vdir, "k06m1", ("k06b1", "k06c1"))  # => THE fix: one file, two parents
    after = count_heads(sdir)  # => ONE tip after the merge
    print(f"before: {before}")  # => Output line: the fork, counted
    print(f"after: {after}")  # => Output line: the join, proven
    print("kata ok")  # => Output line: merge carries no DDL
    shutil.rmtree(sdir, ignore_errors=True)  # => scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
