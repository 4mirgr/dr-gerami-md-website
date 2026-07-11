#!/bin/zsh
cd "$(dirname "$0")" || exit 1
clear
echo "Starting Dr Gerami Website Manager..."
echo "Keep this window open while using the admin panel."
echo
node admin-server.mjs
echo
echo "The manager has stopped. Press any key to close this window."
read -k 1
