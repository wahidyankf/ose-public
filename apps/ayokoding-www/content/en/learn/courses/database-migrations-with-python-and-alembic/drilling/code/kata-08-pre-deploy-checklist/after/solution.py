# => Kata 8 solution: three checks gate the deploy.
import os  # => WHY os: tempdir plus pg vars
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic import command  # => WHY command: run the upgrades
from alembic.config import Config  # => WHY Config: no ini file
from alembic.migration import MigrationContext  # => WHY MigrationContext: read receipts
from alembic.script import ScriptDirectory  # => WHY ScriptDirectory: read history
from sqlalchemy import (
    create_engine,
    inspect as sa_inspect,
    text,
)  # => WHY all: run plus prove


def main():  # => migrate, then verify before declaring victory
    sdir = tempfile.mkdtemp(prefix="kata08-")  # => WHY temp: scratch script dir
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
            "    context.configure(connection=c, version_table='kata08_version')\n"
        )  # => own receipts
        handle.write("    with context.begin_transaction():\n")  # => revision transacts
        handle.write("        context.run_migrations()\n")  # => run the range
    revs = [  # => two stops: parent, then child
        (
            "k08a1",
            None,
            "    op.create_table('kata08_owners',\n"
            "        sa.Column('id', sa.Integer(), primary_key=True))\n",
            "    op.drop_table('kata08_owners')\n",
        ),
        (
            "k08b1",
            "k08a1",
            "    op.create_table('kata08_pets',\n"
            "        sa.Column('id', sa.Integer(), primary_key=True),\n"
            "        sa.Column('owner_id', sa.Integer(), sa.ForeignKey('kata08_owners.id')))\n",
            "    op.drop_table('kata08_pets')\n",
        ),
    ]  # => small chain, three checks
    for rev, down, up, dn in revs:  # => write every file
        down_repr = "None" if down is None else f"'{down}'"  # => base is bare None
        with open(
            os.path.join(vdir, f"{rev}_chain.py"), "w"
        ) as handle:  # => id-prefixed file
            handle.write('"""kata08 chain."""\n')  # => human-readable doc
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
    cfg.set_main_option("version_table", "kata08_version")  # => own receipts
    host = os.environ.get("PGHOST", "localhost")  # => same host
    user = os.environ.get("PGUSER", "postgres")  # => same user
    engine = create_engine(
        f"postgresql+psycopg://{user}@{host}:5432/postgres"
    )  # => direct engine
    with engine.begin() as conn:  # => drops commit together
        conn.execute(
            text("DROP TABLE IF EXISTS kata08_pets")
        )  # => child first, FK rule
        conn.execute(text("DROP TABLE IF EXISTS kata08_owners"))  # => then the parent
        conn.execute(
            text("DROP TABLE IF EXISTS kata08_version")
        )  # => then the receipts
    command.upgrade(cfg, "head")  # => the deploy under test
    script = ScriptDirectory.from_config(cfg)  # => read the file history
    heads = script.get_heads()  # => file tips
    with engine.connect() as conn:  # => one connection for checks
        ctx = MigrationContext.configure(
            conn, opts={"version_table": "kata08_version"}
        )  # => own receipts
        current = ctx.get_current_heads()  # => where the database stands
    live = sorted(
        t
        for t in sa_inspect(engine).get_table_names()
        if t.startswith("kata08_") and t != "kata08_version"
    )  # => data tables only
    print(f"single head: {len(heads) == 1}")  # => Output line: check one, linearity
    print(
        f"at tip: {list(current) == sorted(heads)}"
    )  # => Output line: check two, currency
    print(
        f"tables match: {live == ['kata08_owners', 'kata08_pets']}"
    )  # => Output line: check three, fidelity
    print("kata ok")  # => Output line: checked, not gambled
    shutil.rmtree(sdir, ignore_errors=True)  # => WHY clean: scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
