#!/usr/bin/env bash
set -Eeuo pipefail

readonly RELEASES_DIR="/srv/porchlight/frontend-releases"
readonly INCOMING_DIR="${RELEASES_DIR}/incoming"
readonly CURRENT_LINK="/srv/porchlight/frontend-current"
readonly RELEASE_DIR="${RELEASES_DIR}/release-$(date -u +%Y%m%d%H%M%S)-$$"

if [[ ! -f "${INCOMING_DIR}/index.html" ]]; then
    printf 'Frontend artifact is missing index.html\n' >&2
    exit 1
fi

mv "${INCOMING_DIR}" "${RELEASE_DIR}"
rm -f "${CURRENT_LINK}.new"
ln -s "${RELEASE_DIR}" "${CURRENT_LINK}.new"
mv -Tf "${CURRENT_LINK}.new" "${CURRENT_LINK}"

if [[ -d "${RELEASES_DIR}/current" && ! -L "${RELEASES_DIR}/current" ]]; then
    rm -rf "${RELEASES_DIR}/current"
fi

find "${RELEASES_DIR}" -mindepth 1 -maxdepth 1 -type d -name 'release-*' -printf '%T@ %p\n' \
    | sort -nr | tail -n +4 | cut -d' ' -f2- | xargs -r rm -rf

nginx -t
systemctl reload nginx