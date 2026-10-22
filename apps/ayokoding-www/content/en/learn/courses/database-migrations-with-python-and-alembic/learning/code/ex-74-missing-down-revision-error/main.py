"""Example 74: a parent that does not exist breaks history loading."""

import os  # => os builds the versions path, never hardcoded
import tempfile  # => tempfile gives each run a private script directory

from alembic.config import Config  # => Config locates the script directory
from alembic.script import (
    ScriptDirectory,
)  # => ScriptDirectory reads files without a database

# => A scratch script location: revisions only, no database touched here.
# => the scratch path never reaches stdout, so reruns stay byte-stable
scratch = tempfile.mkdtemp(
    prefix="ex74-"
)  # => unique path, never printed, output stays stable
versions = os.path.join(
    scratch, "versions"
)  # => Alembic discovers revisions in this folder
os.makedirs(versions)  # => create the versions directory on disk

# => A root plus an orphan: the parent id was mistyped and matches nothing.
root_rev = '''"""create ex74 widgets."""

revision = "ex74a1"  # => the only real revision: a root with no parent
down_revision = None  # => no parent: this is where this history starts


def upgrade():  # => forward: the one change that would run
    pass  # => body omitted: loading fails before any DDL matters


def downgrade():  # => reverse: the one undo that would run
    pass  # => body omitted: loading fails before any DDL matters
'''
with open(
    os.path.join(versions, "ex74a1_create_widgets.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(root_rev)  # => the valid revision file now exists on disk
orphan_rev = '''"""add ex74 widget price on a ghost."""

revision = "ex74b1"  # => the orphan: its parent exists nowhere
down_revision = "ex74zzz"  # => mistyped id: no file carries this revision


def upgrade():  # => forward: never reached, the chain cannot load
    pass  # => body omitted: loading fails before any DDL matters


def downgrade():  # => reverse: never reached, the chain cannot load
    pass  # => body omitted: loading fails before any DDL matters
'''
with open(
    os.path.join(versions, "ex74b1_orphan.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(orphan_rev)  # => the orphan file breaks the chain on disk

# => Loading the chain must fail loud: the orphan's parent resolves nowhere.
config = Config()  # => bare Config: no alembic.ini needed for inspection
config.set_main_option("script_location", scratch)  # => versions/ lives here
try:  # => walking the chain resolves every parent: the ghost breaks it
    script = ScriptDirectory.from_config(config)  # => parses every revision file found
    script.get_heads()  # => head resolution follows parent links: ghost link fails
    broken = False  # => reaching here means the ghost parent resolved somehow
except Exception:  # => any failure proves the guard works: broken chains stop here
    broken = True  # => the mistyped parent id breaks loading, as designed
# => loud failure at load time beats silent wrong order at deploy time
print("broken:", broken)  # => Output: broken: True
print("cleaned: yes")  # => Output: cleaned: yes
