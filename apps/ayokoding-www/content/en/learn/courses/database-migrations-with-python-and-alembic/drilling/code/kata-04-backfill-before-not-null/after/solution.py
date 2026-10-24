# => Kata 4 solution: fill first, tighten second.
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


def main():  # => nullable, backfill, then strict
    sdir = tempfile.mkdtemp(prefix="kata04-")  # => WHY temp: scratch script dir
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
            "    context.configure(connection=c, version_table='kata04_version')\n"
        )  # => own receipts
        handle.write("    with context.begin_transaction():\n")  # => revision transacts
        handle.write("        context.run_migrations()\n")  # => run the range
    revs = [  # => three stops: land, fill, tighten
        (
            "k04a1",
            None,
            "    op.create_table('kata04_orders',\n"
            "        sa.Column('id', sa.Integer(), primary_key=True),\n"
            "        sa.Column('status', sa.Text(), nullable=False))\n",
            "    op.drop_table('kata04_orders')\n",
        ),
        (
            "k04b1",
            "k04a1",
            "    op.add_column('kata04_orders',\n"
            "        sa.Column('priority', sa.Text(), nullable=True))\n",
            "    op.drop_column('kata04_orders', 'priority')\n",
        ),
        (
            "k04c1",
            "k04b1",
            "    op.execute(\"UPDATE kata04_orders SET priority = 'p1'\")\n"
            "    op.alter_column('kata04_orders', 'priority', nullable=False)\n",
            "    op.alter_column('kata04_orders', 'priority', nullable=True)\n",
        ),
    ]  # => data fills one way: no reverse fill
    for rev, down, up, dn in revs:  # => write every file
        down_repr = "None" if down is None else f"'{down}'"  # => base is bare None
        with open(
            os.path.join(vdir, f"{rev}_orders.py"), "w"
        ) as handle:  # => id-prefixed file
            handle.write('"""kata04 orders."""\n')  # => human-readable doc
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
    cfg.set_main_option("version_table", "kata04_version")  # => own receipts
    host = os.environ.get("PGHOST", "localhost")  # => same host
    user = os.environ.get("PGUSER", "postgres")  # => same user
    engine = create_engine(
        f"postgresql+psycopg://{user}@{host}:5432/postgres"
    )  # => direct engine
    with engine.begin() as conn:  # => drops commit together
        conn.execute(text("DROP TABLE IF EXISTS kata04_orders"))  # => table first
        conn.execute(
            text("DROP TABLE IF EXISTS kata04_version")
        )  # => then the receipts
    command.upgrade(cfg, "k04a1")  # => schema lands first, alone
    with engine.begin() as conn:  # => seeds commit together
        conn.execute(
            text("INSERT INTO kata04_orders (status) VALUES ('new'), ('paid')")
        )  # => rows predate the column
    command.upgrade(cfg, "head")  # => fill plus tighten land after
    with engine.connect() as conn:  # => one connection for checks
        filled = conn.execute(
            text("SELECT COUNT(*) FROM kata04_orders WHERE priority IS NOT NULL")
        ).scalar()  # => fill proof
    cols = {
        c["name"]: c for c in sa_inspect(engine).get_columns("kata04_orders")
    }  # => columns by name
    print(f"filled: {filled}")  # => Output line: every row got a value
    print(
        f"nullable: {cols['priority']['nullable']}"
    )  # => Output line: strict after the fill
    print("kata ok")  # => Output line: order restored
    shutil.rmtree(sdir, ignore_errors=True)  # => WHY clean: scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
