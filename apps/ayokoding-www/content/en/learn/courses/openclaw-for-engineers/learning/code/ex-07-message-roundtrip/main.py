# => A two-message session: prompts carry ids, replies echo them.
# => Id matching is the whole integrity check.
prompts = [{"id": "m1", "text": "ping"}, {"id": "m2", "text": "status?"}]  # => two outbound prompts with unique ids
# => prompts has 2 entries (type: list)
replies = [{"id": "m1", "text": "pong"}, {"id": "m2", "text": "all green"}]  # => fixture replies echo the prompt ids
# => replies has 2 entries (type: list)
matched = 0  # => matched counts replies paired to a prompt
for prompt in prompts:  # => handle each prompt in send order
    want = prompt["id"]  # => the id this prompt's reply must echo
    # => want is m1, then m2
    got = [r for r in replies if r["id"] == want]  # => find replies echoing this id
    # => got holds exactly one reply each time
    print(prompt["text"] + " -> " + got[0]["text"])  # => Output: ping -> pong, then status? -> all green
    matched += len(got)  # => count this prompt's matched replies
    # => matched reaches 2 after both turns
print("matched: %d of %d" % (matched, len(prompts)))  # => Output: matched: 2 of 2
print("session sound: " + str(matched == len(prompts)))  # => Output: session sound: True
