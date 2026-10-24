# Worked Example 31: What Is New Since Tuesday
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Four facts, one watermark, two newcomers.
# => Since means strictly newer than the watermark.
db = [  # => two old facts and two new ones
    # => Entity 1 part/name.
    (1, "part/name", "Road wheel 700c", 30401),  # => old
    # => Entity 1 part/price.
    (1, "part/price", 180, 30401),  # => old
    # => Entity 2 part/name.
    (2, "part/name", "Track cog 16t", 30402),  # => new
    # => Entity 2 part/price.
    (2, "part/price", 25, 30403),  # => new
    # => Close the collection.
]  # => the watermark splits past from news
# => Keep datoms strictly newer than the watermark, oldest first.
news = sorted((t, e, a, v) for e, a, v, t in db if t > 30401)  # => two newcomers
# => Print the count, then each newcomer.
print("new-datoms:", len(news))  # => Output shows 2
# => Walk each candidate in turn.
for t, e, a, v in news:  # => Tuesday's news in order
    # => The check the lesson quotes.
    print(f"tx={t} e={e} a={a} v={v}")  # => Output lists both
