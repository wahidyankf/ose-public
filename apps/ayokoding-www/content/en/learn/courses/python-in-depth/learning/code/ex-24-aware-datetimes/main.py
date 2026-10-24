# => Example 24: aware datetimes carry their zone everywhere.
from datetime import datetime, timedelta, timezone  # => zone-aware primitives
from zoneinfo import ZoneInfo  # => WHY zoneinfo: real DST rules, not fixed offsets

utc = datetime(2026, 10, 21, 9, 0, tzinfo=timezone.utc)  # => canonical stored form
print(utc.isoformat())  # => Output: 2026-10-21T09:00:00+00:00, offset explicit
jakarta = utc.astimezone(ZoneInfo("Asia/Jakarta"))  # => WHY convert: display only
print(jakarta.utcoffset() == timedelta(hours=7))  # => Output: True, plus seven
london = utc.astimezone(ZoneInfo("Europe/London"))  # => a second display zone
print(london.hour)  # => Output: 10, BST in October shown
print((jakarta - london) == timedelta(0))  # => Output: True, same instant compared
