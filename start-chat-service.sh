#!/usr/bin/env bash
# Start the chat socket service if it's not already running.
# Designed to be called by a cron watchdog every couple of minutes.
set -u

PORT=3003
LOG=/home/z/my-project/chat-service.log
DIR=/home/z/my-project/mini-services/chat-service

# Check if something is already listening on the port
if ss -tlnp 2>/dev/null | grep -q ":${PORT} "; then
  echo "$(date): chat-service already running on ${PORT}"
  exit 0
fi

cd "$DIR" || exit 1
# Fully detach: new session, no controlling terminal, all fds redirected
setsid bash -c 'exec bun index.ts' </dev/null >>"$LOG" 2>&1 &
disown
sleep 2
if ss -tlnp 2>/dev/null | grep -q ":${PORT} "; then
  echo "$(date): chat-service started on ${PORT}"
else
  echo "$(date): FAILED to start chat-service"
fi
