#!/usr/bin/env bash
set -Eeuo pipefail
ln -sfn /srv/porchlight/frontend-releases/current /srv/porchlight/frontend-current
nginx -t
systemctl reload nginx