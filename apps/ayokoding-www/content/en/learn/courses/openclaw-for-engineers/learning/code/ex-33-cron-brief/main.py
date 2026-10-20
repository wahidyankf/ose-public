# => A daily brief: schedule plus scope plus report target.
# => Unwatched work must still be witnessed.
brief = {"schedule": "daily 08:00", "scope": "inbox.md"}  # => when it runs and what it may read
# => brief starts with two fields
brief["report"] = "team-chat: digest"  # => where the result lands every morning
# => report is the third field
fields = ["schedule", "scope", "report"]  # => the three fields a scheduled brief needs
missing = [f for f in fields if f not in brief]  # => list any field the brief forgot
# => missing is [] here
for f in fields:  # => show the brief in canonical order
    print(f + ": " + brief[f])  # => Output: three brief lines
print("runs unwatched: True")  # => cron runs need no human present
print("reports somewhere: " + str("report" in brief))  # => Output: reports somewhere: True
