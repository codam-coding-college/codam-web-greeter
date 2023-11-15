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

# Install data fetching script to /usr/share/codam
/usr/bin/mkdir -p /usr/share/codam
/usr/bin/cp "$ROOT_DIR/systemd/fetch-codam-web-greeter-data.sh" /usr/share/codam/fetch-codam-web-greeter-data.sh

# Copy uninstall script to /usr/share/codam
/usr/bin/cp "$ROOT_DIR/uninstall.sh" /usr/share/codam/uninstall-codam-web-greeter-service.sh

# Create system user if it doesn't exist
if id codam-web-greeter >/dev/null 2>&1; then
	/usr/bin/echo "codam-web-greeter user already exists"
else
	/usr/sbin/adduser --system --group --shell /usr/sbin/nologin --disabled-password --home /dev/null codam-web-greeter
fi

# Install systemd service and timer
/usr/bin/cp "$ROOT_DIR/systemd/codam-web-greeter.service" /etc/systemd/system/codam-web-greeter.service
/usr/bin/cp "$ROOT_DIR/systemd/codam-web-greeter.timer" /etc/systemd/system/codam-web-greeter.timer

# Reload systemd daemon
/usr/bin/systemctl daemon-reload

# Enable and start systemd timer
/usr/bin/systemctl enable codam-web-greeter.timer
/usr/bin/systemctl start codam-web-greeter.timer
