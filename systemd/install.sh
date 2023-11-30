#!/bin/bash

# Exit on error
set -e

# Check if script is run as root
if [ "$EUID" -ne 0 ]; then
	/usr/bin/echo "Please run as root"
	/usr/bin/exit 1
fi

# Get path to the directory this script resides in
ROOT_DIR="$(/usr/bin/dirname "$(/usr/bin/readlink -f "$0")")"

# Install service scripts to /usr/share/codam
/usr/bin/mkdir -p /usr/share/codam
/usr/bin/cp "$ROOT_DIR/system/fetch-codam-web-greeter-data.sh" /usr/share/codam/fetch-codam-web-greeter-data.sh
/usr/bin/cp "$ROOT_DIR/user/init-codam-web-greeter.sh" /usr/share/codam/init-codam-web-greeter.sh
/usr/bin/cp "$ROOT_DIR/user/cleanup-codam-web-greeter.sh" /usr/share/codam/cleanup-codam-web-greeter.sh

# Copy uninstall script to /usr/share/codam
/usr/bin/cp "$ROOT_DIR/uninstall.sh" /usr/share/codam/uninstall-codam-web-greeter-service.sh

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
/usr/bin/echo '{"error": "No data fetched yet"}' > "$DATA_FILE"

# Install systemd system service and timer
/usr/bin/cp "$ROOT_DIR/system/codam-web-greeter.service" /etc/systemd/system/codam-web-greeter.service
/usr/bin/cp "$ROOT_DIR/system/codam-web-greeter.timer" /etc/systemd/system/codam-web-greeter.timer

# Install systemd user service
/usr/bin/cp "$ROOT_DIR/user/codam-web-greeter.service" /etc/systemd/user/codam-web-greeter.service

# Reload systemd daemon
/usr/bin/systemctl daemon-reload
# /usr/bin/systemctl --global daemon-reload

# Enable and start systemd system timer
/usr/bin/systemctl enable codam-web-greeter.timer
/usr/bin/systemctl start codam-web-greeter.timer

# Fetch data for the first time (in the background)
/usr/bin/systemctl start codam-web-greeter.service &

# Enable and start systemd user service for all users
/usr/bin/systemctl --global enable codam-web-greeter.service
