# => A three-call fixture trace: tool name plus arguments.
# => Real traces are longer; the reading motion is identical.
trace = [{"tool": "read", "args": "inbox.md"}]  # => the agent first reads the inbox file
trace.append({"tool": "exec", "args": "wc -w inbox.md"})  # => then it counts the file's words via shell
# => trace now holds two calls
trace.append({"tool": "message", "args": "ses-001: 42 words"})  # => finally it reports back to the session
# => trace now holds three calls
print("calls: %d" % len(trace))  # => Output: calls: 3
for step, call in enumerate(trace, start=1):  # => enumerate numbers the calls from 1
    print("step %d: %s(%s)" % (step, call["tool"], call["args"]))  # => Output: step 1: read(inbox.md), step 2, step 3
tools = [c["tool"] for c in trace]  # => collect just the tool names in order
# => tools is ['read', 'exec', 'message']
print("sequence: " + " > ".join(tools))  # => Output: sequence: read > exec > message
read_first = trace[0]["tool"] == "read"  # => a sound agent reads before it acts
# => read_first is True here
print("read before act: " + str(read_first))  # => Output: read before act: True
