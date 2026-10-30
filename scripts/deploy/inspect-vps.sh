#!/usr/bin/env bash
# Read-only discovery. Never print environment variables or credential files.
set -euo pipefail
printf 'Deployment identity: '; id
printf 'OS: '; uname -sr
printf '\nAvailable services\n'
for service in nginx caddy apache2 docker; do
  printf '%s: ' "$service"
  systemctl is-active "$service" 2>/dev/null || true
done
printf '\nDeployment directories\n'
for directory in /var/www /srv /srv/www /opt /etc/nginx/sites-enabled /etc/caddy; do
  if [ -d "$directory" ]; then ls -ld "$directory"; fi
done
printf '\nPublic web directories\n'
find /var/www /srv/www -maxdepth 2 -type d 2>/dev/null | head -60 || true
printf '\nAvailable deployment helpers\n'
find /usr/local/bin /usr/local/sbin -maxdepth 1 -type f \( -iname '*deploy*' -o -iname '*site*' \) -printf '%p\n' 2>/dev/null || true
printf '\nSudo capabilities\n'
sudo -n -l 2>/dev/null || true
printf '\nNginx virtual-host names and document roots\n'
if command -v nginx >/dev/null; then
  (sudo -n nginx -T 2>/dev/null || nginx -T 2>/dev/null || true) |
    awk '/^# configuration file / || /^[[:space:]]*(server_name|root|listen)[[:space:]]/ {print}'
fi
printf '\nTBCi DNS\n'
getent ahostsv4 tbci.pavelml.ru | head -3 || true
