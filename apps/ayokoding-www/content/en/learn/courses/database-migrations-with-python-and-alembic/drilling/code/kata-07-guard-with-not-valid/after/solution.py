# => Kata 7 solution: the guard lands without scanning.
import os  # => WHY os: tempdir plus pg vars
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic import command  # => WHY command: run the upgrades
from alembic.config import Config  # => WHY Config: no ini file
from sqlalchemy import (
    create_engine,
    inspect as sa_inspect,
    text,
)  # => WHY all: run plus prove


def main():  # => not valid first, validate second
    sdir = tempfile.mkdtemp(prefix="kata07-")  # => WHY temp: scratch script dir
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
            "    context.configure(connection=c, version_table='kata07_version')\n"
        )  # => own receipts
        handle.write("    with context.begin_transaction():\n")  # => revision transacts
        handle.write("        context.run_migrations()\n")  # => run the range
    revs = [  # => two stops: table, then the cheap guard
        (
            "k07a1",
            None,
            "    op.create_table('kata07_items',\n"
            "        sa.Column('id', sa.Integer(), primary_key=True),\n"
            "        sa.Column('qty', sa.Integer(), nullable=False))\n",
            "    op.drop_table('kata07_items')\n",
        ),
        (
            "k07b1",
            "k07a1",
            "    op.create_check_constraint('kata07_qty_nonneg', 'kata07_items',\n"
            "        'qty >= 0', postgresql_not_valid=True)\n"
            "    op.execute('ALTER TABLE kata07_items VALIDATE CONSTRAINT kata07_qty_nonneg')\n",
            "    op.drop_constraint('kata07_qty_nonneg', 'kata07_items')\n",
        ),
    ]  # => the guard arrives in two cheap locks
    for rev, down, up, dn in revs:  # => write every file
        down_repr = "None" if down is None else f"'{down}'"  # => base is bare None
        with open(
            os.path.join(vdir, f"{rev}_items.py"), "w"
        ) as handle:  # => id-prefixed file
            handle.write('"""kata07 items."""\n')  # => human-readable doc
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
    cfg.set_main_option("version_table", "kata07_version")  # => own receipts
    host = os.environ.get("PGHOST", "localhost")  # => same host
    user = os.environ.get("PGUSER", "postgres")  # => same user
    engine = create_engine(
        f"postgresql+psycopg://{user}@{host}:5432/postgres"
    )  # => direct engine
    with engine.begin() as conn:  # => drops commit together
        conn.execute(text("DROP TABLE IF EXISTS kata07_items"))  # => table first
        conn.execute(
            text("DROP TABLE IF EXISTS kata07_version")
        )  # => then the receipts
    command.upgrade(cfg, "k07a1")  # => table lands first, alone
    with engine.begin() as conn:  # => seeds commit together
        conn.execute(
            text("INSERT INTO kata07_items (qty) VALUES (1), (2), (3)")
        )  # => rows predate the guard
    command.upgrade(cfg, "head")  # => guard lands without scanning
    with engine.connect() as conn:  # => one connection for checks
        rows = conn.execute(
            text("SELECT COUNT(*) FROM kata07_items")
        ).scalar()  # => row count proof
    checks = [
        c["name"] for c in sa_inspect(engine).get_check_constraints("kata07_items")
    ]  # => guard names
    print(
        f"check: {'kata07_qty_nonneg' in checks}"
    )  # => Output line: the guard is installed
    print(f"rows: {rows}")  # => Output line: all rows survived
    print("kata ok")  # => Output line: cheap locks, same guarantee
    shutil.rmtree(sdir, ignore_errors=True)  # => WHY clean: scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
