#!/usr/bin/env bash
set -Eeuo pipefail

readonly RELEASES_DIR="/srv/porchlight/frontend-releases"
readonly INCOMING_DIR="${RELEASES_DIR}/incoming"

rm -rf "${INCOMING_DIR}"
mkdir -p "${RELEASES_DIR}"