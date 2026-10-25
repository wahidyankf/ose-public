echo $HOME   # => BAD: unquoted expansion splits and globs
echo "$HOME" # => GOOD: quoted expansion stays one word
