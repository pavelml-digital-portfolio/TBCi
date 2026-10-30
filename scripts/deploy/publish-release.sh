#!/usr/bin/env bash
# Run as vps-deploy through SSH. Only this site's directory is changed.
set -euo pipefail
site_root=/var/www/tbci.pavelml.ru
action=${1:?Expected publish or rollback}
release_id=${2:?Expected release ID}
[[ "$release_id" =~ ^[a-f0-9]{40}-[0-9]+-[0-9]+$ ]] || { echo 'Invalid release ID'; exit 1; }
test -d "$site_root" && test -w "$site_root" || {
  echo "Deployment directory must exist and be writable by $(id -un): $site_root"
  exit 1
}
test ! -e "$site_root/current" || test -L "$site_root/current" || {
  echo 'current must be a symbolic link, refusing to replace an existing directory'; exit 1;
}
test ! -e "$site_root/previous" || test -L "$site_root/previous" || {
  echo 'previous must be a symbolic link, refusing to replace an existing file'; exit 1;
}
release_path="$site_root/releases/$release_id"

case "$action" in
  publish)
    archive=${3:?Expected archive path}
    expected_sha=${4:?Expected archive SHA-256}
    [[ "$archive" == "/tmp/tbci-$release_id.tar.gz" ]] || exit 1
    [[ "$expected_sha" =~ ^[a-f0-9]{64}$ ]] || exit 1
    printf '%s  %s\n' "$expected_sha" "$archive" | sha256sum --check --status
    test ! -e "$release_path" || { echo 'Release already exists'; exit 1; }
    mkdir -p "$site_root/releases"
    chmod 755 "$site_root/releases"
    staging=$(mktemp -d "$site_root/releases/.incoming-$release_id.XXXXXX")
    trap 'rm -rf -- "$staging"; rm -f -- "$archive"' EXIT
    tar --extract --gzip --file "$archive" --directory "$staging" --no-same-owner --no-same-permissions
    test -f "$staging/index.html" && test -f "$staging/app/index.html" && test -f "$staging/deployment.json"
    test -d "$staging/_astro"
    find "$staging" -type d -exec chmod 755 {} +
    find "$staging" -type f -exec chmod 644 {} +
    mv "$staging" "$release_path"
    if test -L "$site_root/current"; then
      previous=$(readlink "$site_root/current")
      ln -s "$previous" "$site_root/.previous-$release_id"
      mv -Tf "$site_root/.previous-$release_id" "$site_root/previous"
    else
      rm -f "$site_root/previous"
    fi
    ln -s "$release_path" "$site_root/.current-$release_id"
    mv -Tf "$site_root/.current-$release_id" "$site_root/current"
    echo "Published $release_id"
    ;;
  rollback)
    test "$(readlink "$site_root/current")" = "$release_path" || {
      echo 'Current release changed; refusing to roll back another deployment'; exit 1;
    }
    if test -L "$site_root/previous"; then
      previous=$(readlink "$site_root/previous")
      ln -s "$previous" "$site_root/.rollback-$release_id"
      mv -Tf "$site_root/.rollback-$release_id" "$site_root/current"
    else
      rm "$site_root/current"
    fi
    echo "Rolled back $release_id"
    ;;
  *) echo 'Expected publish or rollback'; exit 1 ;;
esac
