#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${1:-http://localhost:3000}

echo "Sending 3 test alerts to $BASE_URL/alerts"

curl -s -X POST "$BASE_URL/alerts" -H 'Content-Type: application/json' -d '{"title":"[auth-service] login errors spike","description":"500 errors from /login endpoint","service":"auth-service","severity":"high","source":"slack","metadata":{}}' && echo
sleep 1
curl -s -X POST "$BASE_URL/alerts" -H 'Content-Type: application/json' -d '{"title":"[auth-service] login errors spike","description":"500 errors from /login endpoint","service":"auth-service","severity":"high","source":"slack","metadata":{}}' && echo
sleep 1
curl -s -X POST "$BASE_URL/alerts" -H 'Content-Type: application/json' -d '{"title":"[auth-service] database connection timeout","description":"timeout connecting to users-db","service":"auth-service","severity":"critical","source":"slack","metadata":{}}' && echo

echo "Done."
