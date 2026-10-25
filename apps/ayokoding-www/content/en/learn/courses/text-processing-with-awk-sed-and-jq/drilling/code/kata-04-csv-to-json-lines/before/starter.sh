#!/bin/bash
# => Kata 4 starter: cut keeps the sku column but drops the quantity and header.
# => Task: emit one compact JSON object per data row (see Examples 27 and 33).
# => The answer must print {"sku":"a1","qty":4} and {"sku":"b2","qty":7}.
cut -d, -f1 stock.csv
