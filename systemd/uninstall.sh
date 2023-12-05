#!/bin/bash

# Do not exit on error
set +e

# Check if script is run as root
if [ "$EUID" -ne 0 ]; then
	/usr/bin/echo "Please run as root"
	/usr/bin/exit 1
fi

# Disable and stop systemd system timer
/usr/bin/systemctl disable codam-web-greeter.timer
/usr/bin/systemctl stop codam-web-greeter.timer

# Disable systemd user service
/usr/bin/systemctl --global disable codam-web-greeter.service
/usr/bin/systemctl --global disable codam-web-greeter-activator.timer

# Remove systemd system service and timer
/usr/bin/rm /etc/systemd/system/codam-web-greeter.service
/usr/bin/rm /etc/systemd/system/codam-web-greeter.timer

# Remove systemd user service
/usr/bin/rm /etc/systemd/user/codam-web-greeter.service
/usr/bin/rm /etc/systemd/user/codam-web-greeter-activator.service
/usr/bin/rm /etc/systemd/user/codam-web-greeter-activator.timer

# Reload systemd daemon
/usr/bin/systemctl daemon-reload
# /usr/bin/systemctl --global daemon-reload

# Remove system user
/usr/sbin/deluser codam-web-greeter

# Remove service scripts
/usr/bin/rm /usr/share/codam/codam-web-greeter-*.sh

# Remove data.json
DATA_JSON_FILE="/usr/share/web-greeter/themes/codam/data.json"
if [ -f "$DATA_JSON_FILE" ]; then
	/usr/bin/rm "$DATA_JSON_FILE"
fi

# Remove uninstall script
/usr/bin/rm /usr/share/codam/uninstall-codam-web-greeter-service.sh

# Check if /usr/share/codam is empty - if so, remove it
CODAM_SHARE_FILES=$(/usr/bin/ls -A /usr/share/codam | /usr/bin/wc -l)
if [ "$CODAM_SHARE_FILES" -eq 0 ]; then
	/usr/bin/rmdir /usr/share/codam
fi
