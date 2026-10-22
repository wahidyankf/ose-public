# => Kata 2 solution: the way back is written first.
import os  # => WHY os: tempdir plus pg vars
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic import command  # => WHY command: upgrade plus downgrade
from alembic.config import Config  # => WHY Config: no ini file
from sqlalchemy import (
    create_engine,
    inspect as sa_inspect,
    text,
)  # => WHY all: run plus prove


def main():  # => upgrade proves forward, downgrade proves back
    sdir = tempfile.mkdtemp(prefix="kata02-")  # => WHY temp: scratch script dir
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
            "    context.configure(connection=c, version_table='kata02_version')\n"
        )  # => own receipts
        handle.write("    with context.begin_transaction():\n")  # => revision transacts
        handle.write("        context.run_migrations()\n")  # => run the range
    with open(
        os.path.join(vdir, "k02a1_gadgets.py"), "w"
    ) as handle:  # => fixed id file
        handle.write('"""create kata02 gadgets."""\n')  # => human-readable doc
        handle.write("from alembic import op\n")  # => DDL verbs
        handle.write("import sqlalchemy as sa\n")  # => column types
        handle.write("revision = 'k02a1'\n")  # => WHY fixed: stable reruns
        handle.write("down_revision = None\n")  # => first in chain
        handle.write("def upgrade():\n")  # => forward step
        handle.write("    op.create_table('kata02_gadgets',\n")  # => creates the table
        handle.write(
            "        sa.Column('id', sa.Integer(), primary_key=True))\n"
        )  # => bare key
        handle.write("def downgrade():\n")  # => reverse step, real this time
        handle.write(
            "    op.drop_table('kata02_gadgets')\n"
        )  # => WHY real: rollback must work
    cfg = Config()  # => drive Alembic without ini
    cfg.set_main_option("script_location", sdir)  # => scratch scripts
    cfg.set_main_option("version_table", "kata02_version")  # => own receipts
    host = os.environ.get("PGHOST", "localhost")  # => same host
    user = os.environ.get("PGUSER", "postgres")  # => same user
    engine = create_engine(
        f"postgresql+psycopg://{user}@{host}:5432/postgres"
    )  # => direct engine
    with engine.begin() as conn:  # => drops commit together
        conn.execute(text("DROP TABLE IF EXISTS kata02_gadgets"))  # => table first
        conn.execute(
            text("DROP TABLE IF EXISTS kata02_version")
        )  # => then the receipts
    insp = sa_inspect(engine)  # => inspector proves shape
    command.upgrade(cfg, "head")  # => forward runs
    up = insp.has_table("kata02_gadgets")  # => table present after upgrade
    command.downgrade(cfg, "-1")  # => back runs too
    down = sa_inspect(engine).has_table(
        "kata02_gadgets"
    )  # => WHY fresh: inspectors cache shape
    print(f"after upgrade: {up}")  # => Output line: forward works
    print(f"after downgrade: {down}")  # => Output line: backward works
    print("kata ok")  # => Output line: both directions proven
    shutil.rmtree(sdir, ignore_errors=True)  # => WHY clean: scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
