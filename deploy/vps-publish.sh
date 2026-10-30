#!/usr/bin/env bash
# Build on the runner; SSH keys publish as a limited user on the pinned VPS.
set -euo pipefail
operation=${1:?check|publish|rollback};site=${2:?site}
case "$site" in
  gradecode.ru|pavelml.ru|mbf.gradecode.ru|mindbodyface.pavelml.ru|app.pavelml.ru|bitscore.pavelml.ru|crm.pavelml.ru|wonder.pavelml.ru|compliance.pavelml.ru|tbci.pavelml.ru) ;;
  *) echo 'Site is outside the VPS deployment scope.' >&2; exit 2 ;;
esac
publisher_user=vps-deploy
[[ ${VPS_DEPLOY_USER:-vps-deploy} == vps-deploy ]] || { echo 'Publisher must be vps-deploy.' >&2; exit 2; }
location=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
work=$(mktemp -d);trap 'rm -rf "$work"' EXIT
options=(-o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$location/vps-known-hosts"
  -o ConnectTimeout=20 -o ServerAliveInterval=15 -o ServerAliveCountMax=3
  -o NumberOfPasswordPrompts=1)
if [[ "$site" == tbci.pavelml.ru ]]; then options+=(-o ConnectionAttempts=3); fi
login=$publisher_user;incoming=incoming;publisher=vps-release;password=false
if [[ -n "${VPS_DEPLOY_SSH_KEY:-}" ]]; then
  umask 077
  printf '%s\n' "$VPS_DEPLOY_SSH_KEY" | tr -d '\r' > "$work/key"
  chmod 600 "$work/key"
  ssh-keygen -y -P '' -f "$work/key" >/dev/null
  options+=(-o BatchMode=yes -o IdentitiesOnly=yes -i "$work/key")
elif [[ -n "${MASTERHOST_VPS_SSH_PASSWORD:-}" ]]; then
  # Administrative VPS checks may use root transport; publication still runs as vps-deploy.
  export SSHPASS=$MASTERHOST_VPS_SSH_PASSWORD
  login=root;incoming=/home/$publisher_user/incoming
  publisher="runuser -u $publisher_user -- vps-release";password=true
  options+=(-o PubkeyAuthentication=no)

else
  echo 'Missing VPS_DEPLOY_SSH_KEY. Add the prepared VPS publisher key in repository Actions secrets.' >&2
  exit 2
fi
transport() {
  local phase=$1 status=0 line count=0
  shift
  "$@" 2> "$work/transport-error" || status=$?
  cat "$work/transport-error" >&2
  if (( status != 0 )); then
    echo "::error title=VPS $phase::Transport exited with code $status."
    while IFS= read -r line && (( count < 8 )); do
      line=${line//'%'/'%25'};line=${line//$'\r'/'%0D'}
      echo "::error title=VPS $phase::$line"
      count=$((count + 1))
    done < "$work/transport-error"
    exit "$status"
  fi
}
remote() {
  if "$password"; then transport "remote $operation" sshpass -e ssh "${options[@]}" "$login@87.242.65.97" "$@"
  else transport "remote $operation" ssh "${options[@]}" "$login@87.242.65.97" "$@"; fi
}
upload() {
  if "$password"; then transport 'archive upload' sshpass -e scp "${options[@]}" "$1" "$login@87.242.65.97:$incoming/$2"
  else transport 'archive upload' scp "${options[@]}" "$1" "$login@87.242.65.97:$incoming/$2"; fi
}
case "$operation" in
  check|rollback) remote "$publisher $operation $site" ;;
  publish)
    source=${3:?build directory};format=${4:-static}
    [[ ${GITHUB_SHA:-} =~ ^[0-9a-f]{40}$ ]] || { echo 'Missing commit SHA' >&2; exit 2; }
    archive="${site//./_}-${GITHUB_SHA}-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}.tgz"
    if [[ "$format" == app ]]; then tar -czf "$work/$archive" -C "$source" www app bin VERSION
    else tar -czf "$work/$archive" --transform='s,^\.,www,' -C "$source" .; fi
    checksum=$(sha256sum "$work/$archive" | cut -d' ' -f1)
    upload "$work/$archive" "$archive"
    echo '::notice title=VPS archive::Archive uploaded; starting the release switch.'
    if [[ "$login" == root ]]; then
      remote "chown $publisher_user:$publisher_user $incoming/$archive && chmod 600 $incoming/$archive"
    fi
    remote "$publisher publish $site $archive $checksum $GITHUB_SHA"
    echo "::notice title=VPS release::vps-release publish completed for $GITHUB_SHA."
    # Actions verifies the exact release in a separate step, so a network failure
    # cannot make a completed SSH publication look like an unsuccessful switch.
    if [[ "$site" != tbci.pavelml.ru || ${VPS_DEFER_PUBLIC_CHECK:-0} != 1 ]]; then
      curl --fail --silent --show-error --location --max-redirs 5 --connect-timeout 10 --max-time 30 \
        --retry 4 --retry-all-errors --retry-delay 3 --retry-max-time 150 --output /dev/null "https://$site/"
    fi
    ;;
  *) exit 2 ;;
esac
