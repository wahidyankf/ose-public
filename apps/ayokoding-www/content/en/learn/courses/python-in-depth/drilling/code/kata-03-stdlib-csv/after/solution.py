# => Kata 3 solution: the module owns quoting and headers.
import csv  # => WHY stdlib: the format implemented once, correctly
import io  # => WHY StringIO: demo rows without fixture files

rows = 'name,score\nada,98\n"grace, r.",100\n'  # => header plus two rows
reader = csv.DictReader(io.StringIO(rows))  # => WHY DictReader: keyed by header
parsed = list(reader)  # => materialized for the transcript
print(len(parsed))  # => Output: 2, quoted comma kept whole
print(parsed[1]["name"])  # => Output: grace, r., quoting handled
print(parsed[1]["score"])  # => Output: 100, columns aligned
