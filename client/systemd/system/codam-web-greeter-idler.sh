#!/bin/bash

# Exit on error
set -e

# Get logged in users
WHO_OUTPUT=$(/usr/bin/who)

# Loop through output
while IFS= read -r line; do
	# Get username
	USERNAME=$(/usr/bin/echo "$line" | /usr/bin/awk '{print $1}')
	# Get display (everything between () and remove the ())
	# Cannot use awk here to print a specific column because columns might contain spaces...
	DISPLAY=$(/usr/bin/echo "$line" | /usr/bin/sed -n 's/.*(\(.*\))/\1/p')
	# Go to next line if display does not start with :
	if ! [[ "$DISPLAY" =~ ^: ]]; then
		continue
	fi

	# Get idle time from X-session using sudo
	# This time is used to determine if the session has been idle for too long (possibly without locking the screen)
	IDLE_TIME=$(/usr/bin/sudo -u "$USERNAME" DISPLAY="$DISPLAY" /usr/bin/xprintidle)

	# Check if lock_timestamp file exists, and if so read the locked_at_timestamp
	# This time is used to determine if the screen lock has been active for too long
	# Sometimes xprintidle doesn't work properly when the screen is locked due to programs running in the user session in the background
	TIME_SINCE_LOCK=$((0)) # Placeholder
	if [ -f "/tmp/codam_web_greeter_lock_timestamp_$USERNAME" ]; then
		# Get the locked_at_timestamp from the file
		LOCKED_AT_TIMESTAMP=$(/usr/bin/awk '{print $1}' "/tmp/codam_web_greeter_lock_timestamp_$USERNAME")
		# Sanitize the timestamp to ensure it's a number
		if [[ "$LOCKED_AT_TIMESTAMP" =~ ^[0-9]+$ ]]; then
			# Calculate the time since the session was locked
			TIME_SINCE_LOCK=$((($(/usr/bin/date +%s) - LOCKED_AT_TIMESTAMP) * 1000))
		else
			/usr/bin/echo "Warning: Invalid timestamp in /tmp/codam_web_greeter_lock_timestamp_$USERNAME: $LOCKED_AT_TIMESTAMP" >&2
			TIME_SINCE_LOCK=0
		fi
	fi

	# Check if session has been idle for long enough
	MAX_IDLE_TIME_MINUTES=$((42))
	MAX_IDLE_TIME=$((MAX_IDLE_TIME_MINUTES * 60 * 1000))
	if [ "$IDLE_TIME" -gt "$MAX_IDLE_TIME" ] || [ "$TIME_SINCE_LOCK" -gt "$MAX_IDLE_TIME" ]; then
		/usr/bin/echo "Session for user $USERNAME has been idle for over 42 minutes (idletime $IDLE_TIME ms, time_since_lock $TIME_SINCE_LOCK ms), forcing logout now by restarting lightdm"
		/usr/bin/systemctl restart lightdm
	else
		/usr/bin/echo "Session for $USERNAME has been idle for $((IDLE_TIME / 1000)) seconds, screen locked for $((TIME_SINCE_LOCK / 1000)) seconds"
	fi
done <<< "$WHO_OUTPUT"
