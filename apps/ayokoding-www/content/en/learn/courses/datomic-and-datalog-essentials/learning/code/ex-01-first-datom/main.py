# Worked Example 1: First Datom
# => Kencana Parts Co. is fictional; every number here is fixed.
# => One immutable fact: entity 1 is named Road wheel 700c.
# => A datom is four parts: entity, attribute, value, transaction.
datom = (1, "part/name", "Road wheel 700c", 1001)  # => the whole fact in one tuple
# => Unpack the tuple into its four named positions.
entity, attribute, value, tx = datom  # => names for the four parts
# => The four prints below are the check the lesson quotes.
print("entity:", entity)  # => Output names the identity: 1
# => The check the lesson quotes.
print("attribute:", attribute)  # => Output names the slot: part/name
# => The check the lesson quotes.
print("value:", value)  # => Output carries the payload
# => The check the lesson quotes.
print("tx:", tx)  # => Output stamps the transaction: 1001
