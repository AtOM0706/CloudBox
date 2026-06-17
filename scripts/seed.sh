#!/usr/bin/env bash
# Seeds a demo account with a folder and a couple of files.
# Usage: BASE=http://localhost:8080 ./scripts/seed.sh
set -euo pipefail

BASE="${BASE:-http://localhost:8080}"
EMAIL="${EMAIL:-demo@cloudbox.dev}"
PASS="${PASS:-password123}"

echo "Registering demo user ($EMAIL) at $BASE ..."
TOKEN=$(curl -fsS -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"displayName\":\"Demo User\"}" \
  | sed -n 's/.*"token":"\([^"]*\)".*/\1/p') || {
    echo "Register failed (user may already exist) — trying login ..."
    TOKEN=$(curl -fsS -X POST "$BASE/api/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
      | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
  }

echo "Creating a folder ..."
FOLDER_ID=$(curl -fsS -X POST "$BASE/api/folders" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Welcome to CloudBox","parentId":null}' \
  | sed -n 's/.*"id":\([0-9]*\).*/\1/p')

echo "Uploading sample files ..."
echo "Hello from CloudBox! This file lives in MinIO." > /tmp/readme.txt
curl -fsS -X POST "$BASE/api/files" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/readme.txt" -F "folderId=$FOLDER_ID" > /dev/null

echo "Done. Log in as $EMAIL / $PASS"
