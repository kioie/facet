#!/usr/bin/env bash
# One-time SonarCloud setup for kioie/facet.
# 1. Import https://github.com/kioie/facet at https://sonarcloud.io/projects/create
# 2. SonarCloud → My Account → Security → Generate token
# 3. gh secret set SONAR_TOKEN --repo kioie/facet
# 4. SonarCloud → facet → Administration → Analysis Method → disable Automatic Analysis
set -euo pipefail

if [[ -z "${SONAR_TOKEN:-}" ]]; then
  echo "Set SONAR_TOKEN to a SonarCloud user token, then re-run." >&2
  exit 1
fi

REPO_ID=$(gh api repos/kioie/facet --jq .id)
curl -sf -X POST "https://sonarcloud.io/api/alm_integration/provision_projects" \
  -H "Authorization: Bearer ${SONAR_TOKEN}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "installationKeys=kioie/facet|${REPO_ID}" \
  --data-urlencode "organization=kioie"

echo "Provisioned kioie_facet on SonarCloud."
