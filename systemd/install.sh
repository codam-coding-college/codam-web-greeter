#!/bin/bash

# Exit on error
set -e

# Check if script is run as root
if [ "$EUID" -ne 0 ]; then
	/usr/bin/echo "Please run as root"
	/usr/bin/exit 1
fi

# Check if an existing uninstaller for codam-web-greeter exists
# If it does, we want to uninstall the old version first
UNINSTALL_SCRIPT="/usr/share/codam/uninstall-codam-web-greeter-service.sh"
if [ -f "$UNINSTALL_SCRIPT" ]; then
	/usr/bin/echo "Uninstalling old version of codam-web-greeter..."
	/usr/bin/bash "$UNINSTALL_SCRIPT"
fi

# Get path to the directory this script resides in
ROOT_DIR="$(/usr/bin/dirname "$(/usr/bin/readlink -f "$0")")"

# Make sure xprintidle is installed
if ! /usr/bin/dpkg -s xprintidle >/dev/null 2>&1; then
	/usr/bin/echo "xprintidle is not installed, installing it now"
	/usr/bin/apt-get install -y xprintidle
fi

# Install service scripts to /usr/share/codam
/usr/bin/mkdir -p /usr/share/codam
/usr/bin/cp "$ROOT_DIR/system/codam-web-greeter-fetcher.sh" /usr/share/codam/codam-web-greeter-fetcher.sh
/usr/bin/cp "$ROOT_DIR/system/codam-web-greeter-idler.sh" /usr/share/codam/codam-web-greeter-idler.sh
/usr/bin/chmod 700 /usr/share/codam/codam-web-greeter-idler.sh
/usr/bin/cp "$ROOT_DIR/system/codam-web-greeter-idler-hook.sh" /usr/share/codam/codam-web-greeter-idler-hook.sh
/usr/bin/chmod 500 /usr/share/codam/codam-web-greeter-idler-hook.sh
/usr/bin/cp "$ROOT_DIR/user/codam-web-greeter-init.sh" /usr/share/codam/codam-web-greeter-init.sh
/usr/bin/cp "$ROOT_DIR/user/codam-web-greeter-cleanup.sh" /usr/share/codam/codam-web-greeter-cleanup.sh

# Copy uninstall script to $UNINSTALL_SCRIPT
/usr/bin/cp "$ROOT_DIR/uninstall.sh" "$UNINSTALL_SCRIPT"
/usr/bin/chmod 700 "$UNINSTALL_SCRIPT"

# Create system user if it doesn't exist
if id codam-web-greeter >/dev/null 2>&1; then
	/usr/bin/echo "codam-web-greeter user already exists"
else
	/usr/sbin/adduser --system --group --shell /usr/sbin/nologin --disabled-password --home /dev/null codam-web-greeter
fi

# Create data.json file if it doesn't exist yet
WEB_GREETER_DIR="/usr/share/web-greeter/themes/codam"
DATA_FILE="$WEB_GREETER_DIR/data.json"
/usr/bin/mkdir -p "$WEB_GREETER_DIR"
/usr/bin/touch "$DATA_FILE"
/usr/bin/chmod 644 "$DATA_FILE"
/usr/bin/chown codam-web-greeter:codam-web-greeter "$DATA_FILE"

# Placeholder data.json content
/usr/bin/echo '{"hostname": "nodata", "events": [], "exams": [], "exams_for_host": [], "fetch_time": 0, "message": "", "fixme": "To populate this file, set up the server-side of the greeter theme (see server directory in codam-web-greeter repository)"}' > "$DATA_FILE"

# Install systemd system services and timers
/usr/bin/cp "$ROOT_DIR/system/codam-web-greeter.service" /etc/systemd/system/codam-web-greeter.service
/usr/bin/cp "$ROOT_DIR/system/codam-web-greeter.timer" /etc/systemd/system/codam-web-greeter.timer
/usr/bin/cp "$ROOT_DIR/system/codam-web-greeter-idler.service" /etc/systemd/system/codam-web-greeter-idler.service
/usr/bin/cp "$ROOT_DIR/system/codam-web-greeter-idler.timer" /etc/systemd/system/codam-web-greeter-idler.timer

# Install systemd user service
/usr/bin/cp "$ROOT_DIR/user/codam-web-greeter.service" /etc/systemd/user/codam-web-greeter.service

# Reload systemd daemon
/usr/bin/systemctl daemon-reload
# /usr/bin/systemctl --global daemon-reload

# Enable and start systemd system timer
/usr/bin/systemctl enable codam-web-greeter.timer
/usr/bin/systemctl start codam-web-greeter.timer
/usr/bin/systemctl enable codam-web-greeter-idler.timer
/usr/bin/systemctl start codam-web-greeter-idler.timer

# Fetch data for the first time (in the background)
/usr/bin/systemctl start codam-web-greeter.service &

# Enable systemd user service for all users
/usr/bin/systemctl --global enable codam-web-greeter.service
