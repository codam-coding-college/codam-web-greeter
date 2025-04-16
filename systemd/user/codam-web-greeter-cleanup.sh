#!/bin/bash

# Exit on error
set -e

# Do not run this script for the following users
SKIPPED_USERS="lightdm exam checkin event"
if [[ $SKIPPED_USERS =~ (^|[[:space:]])$USER($|[[:space:]]) ]]; then
	/usr/bin/echo "Skipping ignored user $USER"
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
