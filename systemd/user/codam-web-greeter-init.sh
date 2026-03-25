#!/bin/bash

# Exit on error
set -e

# Do not run this script for the following users
SKIPPED_USERS="lightdm exam checkin event"
if [[ $SKIPPED_USERS =~ (^|[[:space:]])$USER($|[[:space:]]) ]]; then
	/usr/bin/echo "Skipping ignored user $USER"
	exit 0
fi

FACE_PATH="$HOME/.face"
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

# Get the data-server-url variable from the config file, remove /config/ from the url
DATA_SERVER_URL=$(/usr/bin/grep -Po '(?<=data-server-url=).*' /usr/share/web-greeter/themes/codam/settings.ini | /usr/bin/sed 's/^"\(.*\)"$/\1/' | /usr/bin/sed 's/\/config//')

# Download the user's profile picture from Intra if no .face file exists in the home directory
if [ ! -f "$FACE_PATH" ]; then
	/usr/bin/echo "No user image found in $FACE_PATH, attempting download from the clusterdata server"

	# Get the user's profile picture from Intra through the clusterdata server
	IMAGE_URL="${DATA_SERVER_URL}user/$USER/.face"
	/usr/bin/echo "Downloading user image from $IMAGE_URL to $FACE_PATH"
	/usr/bin/curl -L -s "$IMAGE_URL" -o "$FACE_PATH" || true # Prevent curl from erroring out if the download fails
else
	/usr/bin/echo "Existing user image found at $FACE_PATH, not overwriting it with a freshly downloaded copy"
fi

# Remove existing user image in /tmp
/usr/bin/rm -f "$TMP_AVATAR_PATH"

# Copy user's .face file to /tmp
if [ -f "$FACE_PATH" ]; then
	/usr/bin/cp "$FACE_PATH" "$TMP_AVATAR_PATH"
	/usr/bin/chmod 666 "$TMP_AVATAR_PATH" # Allow all users to delete the file
	/usr/bin/echo "Copied user image $FACE_PATH to $TMP_AVATAR_PATH"
else
	/usr/bin/echo "No user image found at $FACE_PATH, not copying"
fi
