# => Example 57: fg %1 resumes the job in the foreground and waits.
set -euo pipefail # => strict header first, as in every example
# => WHY fg over wait: foregrounding also returns terminal control.
set -m         # => monitor mode on: fg exists only with job control
sleep 0.1 &    # => short sleeper: fg has something to bring forward
fg %1          # => bring job one forward; echoes its fixed command line
echo "resumed" # => printed after the foregrounded job finishes
