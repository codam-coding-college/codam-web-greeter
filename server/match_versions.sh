#!/bin/bash

# This script matches the package.json version of the server to the version of the greeter.

# CD to the directory of this script
cd "$(dirname "$0")" || exit 1

SERVER_VERSION=$(jq -r '.version' package.json)
GREETER_VERSION=$(jq -r '.version' ../package.json)

TMP=$(mktemp)
echo "Updating server version from $SERVER_VERSION to $GREETER_VERSION..."
jq '.version = $new_version' --arg new_version "$GREETER_VERSION" package.json > "$TMP" && mv "$TMP" package.json # package.json
npm i --package-lock-only # package-lock.json
echo "Done!"
