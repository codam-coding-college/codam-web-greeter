#!/bin/bash

# Exit on error
set -e

# Only run for users in the student or piscine group
if ! /usr/bin/groups | /usr/bin/grep -qE '(student|piscine)'; then
	/usr/bin/echo "Not running for user $(/usr/bin/whoami)"
	exit 0
fi

TMP_WALLPAPER_PATH="/tmp/codam-web-greeter-user-wallpaper"
TMP_AVATAR_PATH="/tmp/codam-web-greeter-user-avatar"

# Remove existing wallpaper in /tmp
if [ -f "$TMP_WALLPAPER_PATH" ]; then
	/usr/bin/rm -f "$TMP_WALLPAPER_PATH"
	/usr/bin/echo "Removed wallpaper in $TMP_WALLPAPER_PATH"
fi

# Remove existing user image in /tmp
if [ -f "$TMP_AVATAR_PATH" ]; then
	/usr/bin/rm -f "$TMP_AVATAR_PATH"
	/usr/bin/echo "Removed user image in $TMP_AVATAR_PATH"
fi
