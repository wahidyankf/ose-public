# => Kata 9 solution: stamp the truth, then migrate forward.
import os  # => WHY os: tempdir plus pg vars
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic import command  # => WHY command: stamp plus upgrade
from alembic.config import Config  # => WHY Config: no ini file
from alembic.migration import MigrationContext  # => WHY MigrationContext: read receipts
from alembic.script import ScriptDirectory  # => WHY ScriptDirectory: count the heads
from sqlalchemy import (
    create_engine,
    inspect as sa_inspect,
    text,
)  # => WHY all: run plus prove


def main():  # => legacy tables adopted, data untouched, history honest
    sdir = tempfile.mkdtemp(prefix="kata09-")  # => WHY temp: scratch script dir
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
            "    context.configure(connection=c, version_table='kata09_version')\n"
        )  # => own receipts
        handle.write("    with context.begin_transaction():\n")  # => revision transacts
        handle.write("        context.run_migrations()\n")  # => run the range
    revs = [  # => files describe the schema the database already has
        (
            "k09a1",
            None,
            "    op.create_table('kata09_legacy',\n"
            "        sa.Column('id', sa.Integer(), primary_key=True),\n"
            "        sa.Column('name', sa.Text(), nullable=False))\n",
            "    op.drop_table('kata09_legacy')\n",
        ),
        (
            "k09b1",
            "k09a1",
            "    op.add_column('kata09_legacy',\n"
            "        sa.Column('email', sa.Text(), nullable=True))\n",
            "    op.drop_column('kata09_legacy', 'email')\n",
        ),
    ]  # => k09a1 matches legacy; k09b1 moves it forward
    for rev, down, up, dn in revs:  # => write every file
        down_repr = "None" if down is None else f"'{down}'"  # => base is bare None
        with open(
            os.path.join(vdir, f"{rev}_legacy.py"), "w"
        ) as handle:  # => id-prefixed file
            handle.write('"""kata09 legacy."""\n')  # => human-readable doc
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
    cfg.set_main_option("version_table", "kata09_version")  # => own receipts
    host = os.environ.get("PGHOST", "localhost")  # => same host
    user = os.environ.get("PGUSER", "postgres")  # => same user
    engine = create_engine(
        f"postgresql+psycopg://{user}@{host}:5432/postgres"
    )  # => direct engine
    with engine.begin() as conn:  # => legacy setup commits together
        conn.execute(text("DROP TABLE IF EXISTS kata09_legacy"))  # => start clean
        conn.execute(
            text("DROP TABLE IF EXISTS kata09_version")
        )  # => no receipts either
        conn.execute(
            text(
                "CREATE TABLE kata09_legacy (id SERIAL PRIMARY KEY, name TEXT NOT NULL)"
            )
        )  # => legacy handiwork
        conn.execute(
            text("INSERT INTO kata09_legacy (name) VALUES ('ada'), ('grace')")
        )  # => real data, no revision
    command.stamp(cfg, "k09a1")  # => THE act: declare the past without replaying it
    command.upgrade(cfg, "head")  # => only k09b1 runs: the honest delta
    with engine.connect() as conn:  # => one connection for checks
        ctx = MigrationContext.configure(
            conn, opts={"version_table": "kata09_version"}
        )  # => own receipts
        current = ctx.get_current_heads()  # => where the database stands
        rows = conn.execute(
            text("SELECT COUNT(*) FROM kata09_legacy")
        ).scalar()  # => legacy rows intact
    cols = sorted(
        c["name"] for c in sa_inspect(engine).get_columns("kata09_legacy")
    )  # => final shape, sorted
    print(f"current: {current[0]}")  # => Output line: stamped past, migrated present
    print(f"rows: {rows}")  # => Output line: both legacy rows survived
    print(f"columns: {cols}")  # => Output line: old shape plus the new column
    print("kata ok")  # => Output line: adopted, not replayed
    shutil.rmtree(sdir, ignore_errors=True)  # => WHY clean: scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
