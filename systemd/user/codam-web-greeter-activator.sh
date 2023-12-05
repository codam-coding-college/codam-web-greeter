#!/bin/bash

# Exit on error
set -e

# Get idle time from X-session
IDLE_TIME=$(/usr/bin/xprintidle)

# Check if session has been idle for over 42 minutes
if [ "$IDLE_TIME" -gt 2520000 ]; then
	/usr/bin/echo "Session has been idle for over 42 minutes, forcing logout"
	/usr/bin/gnome-session-quit --force
fi
