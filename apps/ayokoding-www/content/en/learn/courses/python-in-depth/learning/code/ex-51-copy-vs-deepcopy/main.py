# => Example 51: each copy level isolates a different depth.
import copy  # => WHY copy: depth choices live in one module

original = {"tags": ["web"]}  # => nested: outer dict plus inner list
alias = original  # => WHY alias: deliberately shared working state
alias["tags"].append("api")  # => mutation visible through both names
print(original["tags"])  # => Output: ['web', 'api'], sharing is total
shallow = original.copy()  # => WHY shallow: new dict, shared inner list
shallow["tags"].append("db")  # => inner list still shared: both see it
print(original["tags"])  # => Output: ['web', 'api', 'db'], inner shared
deep = copy.deepcopy(original)  # => WHY deep: the whole graph duplicated
deep["tags"].append("cache")  # => fully independent from here on
print(len(original["tags"]))  # => Output: 3, deep copy isolated
print(len(deep["tags"]))  # => Output: 4, the independent line
