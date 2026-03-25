#!/bin/bash
#
# This script is executed after a user has been logged out due to inactivity by the codam-web-greeter-idler.sh script.
# It receives the following arguments:
# $1: username of the user that was logged out
# $2: idle time in milliseconds
# $3: time since screen was locked in milliseconds
# $4: max idle time in milliseconds
#
# You can use this script to perform custom actions, such as logging, notifications, coalition system integration, etc.
# It can be easily customized using the Ansible codam.webgreeter role.
#
# Example: Log the logout event to a file
# LOGFILE="/var/log/codam-web-greeter-idle-logout.log"
# echo "$(date): User '$1' was logged out due to inactivity (idletime: $2 ms, time_since_lock: $3 ms, max_idle_time: $4 ms)" >> "$LOGFILE"
