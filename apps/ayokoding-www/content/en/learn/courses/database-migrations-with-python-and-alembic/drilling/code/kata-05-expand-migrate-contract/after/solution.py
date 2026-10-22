# => Kata 5 solution: three steps keep old and new code alive.
import os  # => WHY os: tempdir plus pg vars
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic import command  # => WHY command: run the upgrades
from alembic.config import Config  # => WHY Config: no ini file
from alembic.script import ScriptDirectory  # => WHY ScriptDirectory: count the heads
from sqlalchemy import (
    create_engine,
    inspect as sa_inspect,
    text,
)  # => WHY all: run plus prove


def main():  # => add, copy, drop: the rename in three deployable stops
    sdir = tempfile.mkdtemp(prefix="kata05-")  # => WHY temp: scratch script dir
    vdir = os.path.join(sdir, "versions")  # => Alembic reads this subdir
    os.makedirs(vdir)  # => create before writing
    with open(os.path.join(sdir, "env.py"), "w") as handle:  # => Alembic needs env.py
        handle.write("from alembic import context\n")  # => migration hook
        handle.write("from sqlalchemy import create_engine\n")  # => connect here
        handle.write("import os\n")  # => read PGHOST
        handle.write(
            "host = os.environ.get('PGHOST', 'localhost')\n"
        )  # => service host
        handle.write("user = os.environ.get('PGUSER', 'postgres')\n")  # => trust user
        handle.write(
            "url = f'postgresql+psycopg://{user}@{host}:5432/postgres'\n"
        )  # => service url
        handle.write("engine = create_engine(url)\n")  # => one engine per run
        handle.write("with engine.connect() as c:\n")  # => context needs a connection
        handle.write(
            "    context.configure(connection=c, version_table='kata05_version')\n"
        )  # => own receipts
        handle.write("    with context.begin_transaction():\n")  # => revision transacts
        handle.write("        context.run_migrations()\n")  # => run the range
    revs = [  # => expand, migrate, contract
        (
            "k05a1",
            None,
            "    op.create_table('kata05_users',\n"
            "        sa.Column('id', sa.Integer(), primary_key=True),\n"
            "        sa.Column('name', sa.Text(), nullable=False))\n",
            "    op.drop_table('kata05_users')\n",
        ),
        (
            "k05b1",
            "k05a1",
            "    op.add_column('kata05_users',\n"
            "        sa.Column('email', sa.Text(), nullable=True))\n",
            "    op.drop_column('kata05_users', 'email')\n",
        ),
        (
            "k05c1",
            "k05b1",
            "    op.execute('UPDATE kata05_users SET email = name')\n"
            "    op.drop_column('kata05_users', 'name')\n",
            "    pass\n",
        ),
    ]  # => data moves one way: no reverse copy
    for rev, down, up, dn in revs:  # => write every file
        down_repr = "None" if down is None else f"'{down}'"  # => base is bare None
        with open(
            os.path.join(vdir, f"{rev}_users.py"), "w"
        ) as handle:  # => id-prefixed file
            handle.write('"""kata05 users."""\n')  # => human-readable doc
            handle.write("from alembic import op\n")  # => DDL verbs
            handle.write("import sqlalchemy as sa\n")  # => column types
            handle.write(f"revision = '{rev}'\n")  # => fixed id
            handle.write(f"down_revision = {down_repr}\n")  # => chain order
            handle.write("def upgrade():\n")  # => forward step
            handle.write(up)  # => caller-supplied DDL
            handle.write("def downgrade():\n")  # => reverse step
            handle.write(dn)  # => caller-supplied reverse
    cfg = Config()  # => drive Alembic without ini
    cfg.set_main_option("script_location", sdir)  # => scratch scripts
    cfg.set_main_option("version_table", "kata05_version")  # => own receipts
    host = os.environ.get("PGHOST", "localhost")  # => same host
    user = os.environ.get("PGUSER", "postgres")  # => same user
    engine = create_engine(
        f"postgresql+psycopg://{user}@{host}:5432/postgres"
    )  # => direct engine
    with engine.begin() as conn:  # => drops commit together
        conn.execute(text("DROP TABLE IF EXISTS kata05_users"))  # => table first
        conn.execute(
            text("DROP TABLE IF EXISTS kata05_version")
        )  # => then the receipts
    command.upgrade(cfg, "k05a1")  # => old column lands first, alone
    with engine.begin() as conn:  # => seeds commit together
        conn.execute(
            text("INSERT INTO kata05_users (name) VALUES ('ada')")
        )  # => data under the old name
    command.upgrade(cfg, "head")  # => add, copy, drop land after
    cols = sorted(
        c["name"] for c in sa_inspect(engine).get_columns("kata05_users")
    )  # => final shape, sorted
    heads = len(
        ScriptDirectory.from_config(cfg).get_heads()
    )  # => history stayed linear
    print(f"columns: {cols}")  # => Output line: email in, name out
    print(f"heads: {heads}")  # => Output line: no fork anywhere
    print("kata ok")  # => Output line: rename with a deploy window
    shutil.rmtree(sdir, ignore_errors=True)  # => WHY clean: scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
