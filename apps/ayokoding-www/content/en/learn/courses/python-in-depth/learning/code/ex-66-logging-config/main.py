# => Example 66: leveled events with one configuration.
# => Names route records: deploy events stay separable from libraries.
# => Gates silence verbosity: one level change, no code edits.
# => Stderr carries diagnostics: stdout stays pure for results.
import io  # => WHY capture: the transcript pins the record bytes
import logging  # => WHY logging: levels, routing, and formatting

stream = io.StringIO()  # => in-memory handler target for the demo
handler = logging.StreamHandler(stream)  # => records flow here, not stdout
handler.setFormatter(
    logging.Formatter("%(levelname)s %(name)s %(message)s")
)  # => WHY fixed: stable shape
logger = logging.getLogger("deploy")  # => WHY named: records carry origin
logger.addHandler(handler)  # => the single configured route
logger.setLevel(logging.INFO)  # => WHY gate: debug muted without code edits
logger.debug("chatty detail")  # => muted: below the INFO gate
logger.info("gate passed")  # => the event that survives
logger.warning("disk filling")  # => higher level always passes
print(
    repr(stream.getvalue())
)  # => Output: 'INFO deploy gate passed\nWARNING deploy disk filling\n'
print(logger.level == logging.INFO)  # => Output: True, gate set
