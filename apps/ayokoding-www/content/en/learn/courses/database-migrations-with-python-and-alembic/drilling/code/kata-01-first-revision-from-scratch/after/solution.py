# => Kata 1 solution: the table arrives with a receipt.
import os  # => WHY os: tempdir plus pg vars
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic import command  # => WHY command: run the upgrade
from alembic.config import Config  # => WHY Config: no ini file
from alembic.migration import MigrationContext  # => WHY MigrationContext: read receipts
from sqlalchemy import (
    create_engine,
    inspect as sa_inspect,
    text,
)  # => WHY all: run plus prove


def main():  # => write one revision, upgrade, prove both halves
    sdir = tempfile.mkdtemp(prefix="kata01-")  # => WHY temp: scratch script dir
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
            "    context.configure(connection=c, version_table='kata01_version')\n"
        )  # => own receipts
        handle.write("    with context.begin_transaction():\n")  # => revision transacts
        handle.write("        context.run_migrations()\n")  # => run the range
    with open(
        os.path.join(vdir, "k01a1_widgets.py"), "w"
    ) as handle:  # => fixed id file
        handle.write('"""create kata01 widgets."""\n')  # => human-readable doc
        handle.write("from alembic import op\n")  # => DDL verbs
        handle.write("import sqlalchemy as sa\n")  # => column types
        handle.write("revision = 'k01a1'\n")  # => WHY fixed: stable reruns
        handle.write("down_revision = None\n")  # => first in chain
        handle.write("def upgrade():\n")  # => forward step
        handle.write("    op.create_table('kata01_widgets',\n")  # => the versioned DDL
        handle.write(
            "        sa.Column('id', sa.Integer(), primary_key=True),\n"
        )  # => key
        handle.write(
            "        sa.Column('name', sa.Text(), nullable=False))\n"
        )  # => named widgets
        handle.write("def downgrade():\n")  # => reverse step
        handle.write("    op.drop_table('kata01_widgets')\n")  # => clean reverse
    cfg = Config()  # => drive Alembic without ini
    cfg.set_main_option("script_location", sdir)  # => scratch scripts
    cfg.set_main_option("version_table", "kata01_version")  # => own receipts
    host = os.environ.get("PGHOST", "localhost")  # => same host
    user = os.environ.get("PGUSER", "postgres")  # => same user
    engine = create_engine(
        f"postgresql+psycopg://{user}@{host}:5432/postgres"
    )  # => direct engine
    with engine.begin() as conn:  # => drops commit together
        conn.execute(text("DROP TABLE IF EXISTS kata01_widgets"))  # => table first
        conn.execute(
            text("DROP TABLE IF EXISTS kata01_version")
        )  # => then the receipts
    command.upgrade(cfg, "head")  # => the revision runs for real
    with engine.connect() as conn:  # => one connection for checks
        ctx = MigrationContext.configure(
            conn, opts={"version_table": "kata01_version"}
        )  # => own receipts
        current = ctx.get_current_heads()  # => where the database stands
    tables = sorted(
        t
        for t in sa_inspect(engine).get_table_names()
        if t.startswith("kata01_") and t != "kata01_version"
    )  # => data tables only
    print(f"tables: {tables}")  # => Output line: the table exists
    print(f"version: {current[0]}")  # => Output line: the receipt names the revision
    print("kata ok")  # => Output line: versioned, not ad-hoc
    shutil.rmtree(sdir, ignore_errors=True)  # => WHY clean: scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
