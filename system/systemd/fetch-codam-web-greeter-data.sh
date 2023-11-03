#!/bin/bash

# Exit on error
set -e

# Get the data-server-url variable from the config file and append the hostname
DATA_SERVER_URL=$(/usr/bin/grep -Po '(?<=data-server-url=).*' /usr/share/web-greeter/themes/codam/settings.ini)
DATA_SERVER_URL="$DATA_SERVER_URL/$(/usr/bin/hostname)"

/usr/bin/echo "Starting run at $(/usr/bin/date)"
/usr/bin/echo "Fetching data from $DATA_SERVER_URL..."

# Get the data from the data server
DATA=$(/usr/bin/curl -s "$DATA_SERVER_URL")

# Check if the data is valid JSON
if ! /usr/bin/jq -e . >/dev/null 2>&1 <<<"$DATA"; then
	/usr/bin/echo "Invalid JSON data received from data server"
	/usr/bin/exit 1
else
	/usr/bin/echo "Valid JSON data received from data server"
fi

# Create a file for the data with the correct permissions and store the data in it
DATA_FILE="/usr/share/web-greeter/themes/codam/data.json"
/usr/bin/touch "$DATA_FILE"
/usr/bin/chmod 644 "$DATA_FILE"
/usr/bin/chown codam-web-greeter:codam-web-greeter "$DATA_FILE"
/usr/bin/echo "$DATA" > "$DATA_FILE"

/usr/bin/echo "Data fetched successfully and saved to $DATA_FILE"
