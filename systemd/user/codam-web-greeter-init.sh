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
/usr/bin/rm -f "$TMP_WALLPAPER_PATH"

# Get the picture to be used as a screensaver specified by Gnome.
# Do not use the desktop wallpaper since there are two: one for light and one for dark mode.
# The screensaver is always the same and points to the current wallpaper.
WALLPAPER=$(/usr/bin/gsettings get org.gnome.desktop.screensaver picture-uri | /usr/bin/sed "s/^['\"]\(.*\)['\"]$/\1/")

if [ -z "$WALLPAPER" ]; then
	/usr/bin/echo "No Gnome screensaver wallpaper found"
	exit 1
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
		/usr/bin/chmod 666 "$TMP_WALLPAPER_PATH" # Allow all users to delete the file
		/usr/bin/echo "Copied wallpaper $WALLPAPER_PATH to $TMP_WALLPAPER_PATH"
	else
		/usr/bin/echo "Wallpaper $WALLPAPER_PATH does not exist"
	fi
else
	/usr/bin/echo "Wallpaper $WALLPAPER is not a local file"
fi

# Remove existing user image in /tmp
/usr/bin/rm -f "$TMP_AVATAR_PATH"

# Copy user's .face file to /tmp
if [ -f "$HOME/.face" ]; then
	/usr/bin/cp "$HOME/.face" "$TMP_AVATAR_PATH"
	/usr/bin/chmod 666 "$TMP_AVATAR_PATH" # Allow all users to delete the file
	/usr/bin/echo "Copied user image $HOME/.face to $TMP_AVATAR_PATH"
fi
