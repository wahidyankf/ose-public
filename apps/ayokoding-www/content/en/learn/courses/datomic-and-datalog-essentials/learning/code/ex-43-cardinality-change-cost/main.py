# Worked Example 43: Changing Cardinality Without Breaking Readers
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Old readers see one phone; new readers see both.
# => A new slot absorbs the change; the old one stands.
db = [  # => one phone under the old slot, two under the new
    # => Entity 20 customer/phone.
    (20, "customer/phone", "022-111", 50401),  # => the original number
    # => Entity 20 customer/phones.
    (20, "customer/phones", "022-111", 50402),  # => folded into the new set
    # => Entity 20 customer/phones.
    (20, "customer/phones", "022-222", 50402),  # => the second number
    # => Close the collection.
]  # => eras overlap by design
# => Old readers query the original slot; new readers query the set.
old_reading = [v for e, a, v, _t in db if a == "customer/phone"]  # => one number
# => Compute the next value.
phones = [v for _e, a, v, _t in db if a == "customer/phones"]  # => the set
# => New readers see both numbers, sorted.
new_reading = sorted(phones)  # => both numbers
# => Print both readings.
print("old-readers:", old_reading)  # => Output shows one phone
# => The check the lesson quotes.
print("new-readers:", new_reading)  # => Output shows both phones
