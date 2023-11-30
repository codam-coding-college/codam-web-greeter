#!/bin/bash

# Exit on error
set -e

TMP_WALLPAPER_PATH="/tmp/codam-web-greeter-user-wallpaper"

# Remove existing wallpaper in /tmp
if [ -f "$TMP_WALLPAPER_PATH" ]; then
	/usr/bin/rm -f "$TMP_WALLPAPER_PATH"
	/usr/bin/echo "Removed wallpaper in $TMP_WALLPAPER_PATH"
fi
