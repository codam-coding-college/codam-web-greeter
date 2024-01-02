#!/bin/bash

# Exit on error
set -e

# Get logged in users
WHO_OUTPUT=$(/usr/bin/who)

# Loop through output
while IFS= read -r line; do
	# Get username
	USERNAME=$(echo "$line" | awk '{print $1}')
	# Get display
	DISPLAY=$(echo "$line" | awk '{print $5}' | sed 's/[(|)]//g')
	# Go to next line if display does not start with :
	if ! [[ "$DISPLAY" =~ ^: ]]; then
		continue
	fi
	# Get idle time from X-session using sudo
	IDLE_TIME=$(/usr/bin/sudo -u "$USERNAME" DISPLAY="$DISPLAY" /usr/bin/xprintidle)
	# Check if session has been idle for over 42 minutes
	if [ "$IDLE_TIME" -gt 2520000 ]; then
		/usr/bin/echo "Session for user $USERNAME has been idle for over 42 minutes (idletime $IDLE_TIME ms), forcing logout now"
		/usr/bin/systemd-run --wait --user --machine "$USERNAME@.host" /usr/bin/gnome-session-quit --force
	else
		/usr/bin/echo "Session for $USERNAME has been idle for $((IDLE_TIME / 1000)) seconds"
	fi
done <<< "$WHO_OUTPUT"
