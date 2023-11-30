#!/bin/bash

# Exit on error
set -e

TMP_WALLPAPER_PATH="/tmp/codam-web-greeter-user-wallpaper"

# Remove existing wallpaper in /tmp
/usr/bin/rm -f "$TMP_WALLPAPER_PATH"

# Get the picture to be used as a screensaver specified by Gnome.
# Do not use the desktop wallpaper since there are two: one for light and one for dark mode.
# The screensaver is always the same and points to the current wallpaper.
WALLPAPER=$(/usr/bin/gsettings get org.gnome.desktop.screensaver picture-uri | /usr/bin/sed "s/^['\"]\(.*\)['\"]$/\1/")

if [ -z "$WALLPAPER" ]; then
	/usr/bin/echo "No Gnome screensaver wallpaper found"
	/usr/bin/exit 1
fi

/usr/bin/echo "Found Gnome screensaver wallpaper $WALLPAPER"

# Check if the wallpaper starts with file://
if [[ "$WALLPAPER" == file://* ]]; then
	# Get the path to the wallpaper
	WALLPAPER_PATH=$(/usr/bin/sed 's/^file:\/\///' <<<"$WALLPAPER")

	# Check if the wallpaper exists
	if [ -f "$WALLPAPER_PATH" ]; then
		# Copy the wallpaper to /tmp (without extension)
		/usr/bin/cp "$WALLPAPER_PATH" "$TMP_WALLPAPER_PATH"
		/usr/bin/echo "Copied wallpaper $WALLPAPER_PATH to $TMP_WALLPAPER_PATH"
	else
		/usr/bin/echo "Wallpaper $WALLPAPER_PATH does not exist"
	fi
else
	/usr/bin/echo "Wallpaper $WALLPAPER is not a local file"
fi
