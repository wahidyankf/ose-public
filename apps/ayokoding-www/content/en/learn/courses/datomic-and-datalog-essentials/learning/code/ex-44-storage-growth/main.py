# Worked Example 44: History Has a Storage Price
# => Kencana Parts Co. is fictional; every number here is fixed.
# => Ten repricings, ten datoms, one mutable cell.
# => Recall is stored, never reconstructed.
db = [
    (1, "part/price", 170 + i, 60101 + i) for i in range(10)
]  # => ten eras, ten facts
# => A row store would hold one cell; the log holds every era.
mutable_cells = 1  # => the single overwritten cell
# => Print both counts side by side.
print("datoms:", len(db))  # => Output shows 10
# => The check the lesson quotes.
print("mutable-cells:", mutable_cells)  # => Output shows 1
