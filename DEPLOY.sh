#!/usr/bin/env bash
# Publish only this site. Never force-push, delete projects, change DNS or publish to a different repository.
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
mode="${1:---check}"
case "$mode" in
  --check|--preview|--production) ;;
  *) printf '%s\n' 'Usage: bash DEPLOY.sh [--check|--preview|--production]' >&2; exit 2 ;;
esac
for cmd in node npm; do
  command -v "$cmd" >/dev/null || { echo "Missing required command: $cmd" >&2; exit 1; }
done
npm ci --ignore-scripts --no-audit --no-fund
npm run build
if [[ "$mode" == '--check' ]]; then
  echo 'Local checks completed. No GitHub/Vercel changes were made.'
  exit 0
fi
for cmd in git gh vercel; do
  command -v "$cmd" >/dev/null || { echo "Missing required command: $cmd. See DEPLOY-RU.md." >&2; exit 1; }
done
read_target() { node -e 'const fs=require("fs"); console.log(JSON.parse(fs.readFileSync("deployment-target.json","utf8"))[process.argv[1]])' "$1"; }
owner="$(read_target githubOwner)"
repo="$(read_target githubRepository)"
project="$(read_target vercelProjectName)"
project_id="$(read_target vercelProjectId)"
team="$(read_target vercelTeamSlug)"
remote="https://github.com/$owner/$repo.git"

# Auth is handled only by the official CLIs. Never echo or save tokens in project files.
gh auth status
login="$(gh api user --jq .login)"
[[ "$login" == "$owner" ]] || { echo "GitHub account must be $owner, not $login." >&2; exit 1; }
vercel whoami
project_info="$(vercel project inspect "$project" --scope "$team" --no-color 2>&1)" || {
  printf '%s\n' "$project_info" >&2
  echo 'The intended Vercel project is not accessible. Nothing has been pushed.' >&2
  exit 1
}
[[ "$project_info" == *"$project_id"* ]] || {
  echo 'Could not verify the exact Vercel project ID. Stopping without creating another project.' >&2
  exit 1
}
if [[ -e .vercel/project.json ]]; then
  node --input-type=module <<'JS'
import fs from 'node:fs';
const target=JSON.parse(fs.readFileSync('deployment-target.json','utf8'));
const linked=JSON.parse(fs.readFileSync('.vercel/project.json','utf8'));
if (linked.projectId!==target.vercelProjectId || linked.orgId!==target.vercelTeamId) {
  throw new Error('Local Vercel directory is linked to a different project. No changes made.');
}
JS
fi

# A first import is allowed only into a new/empty repository, or this exact local Git history.
if [[ ! -d .git ]]; then
  git init -b main
fi
[[ "$(git rev-parse --show-toplevel)" == "$(pwd -P)" ]] || { echo 'Unexpected Git root.' >&2; exit 1; }
[[ "$(git branch --show-current)" == main ]] || { echo 'Expected local branch main.' >&2; exit 1; }
if existing_remote="$(git remote get-url origin 2>/dev/null)"; then
  case "$existing_remote" in
    "$remote"|"https://github.com/$owner/$repo"|"git@github.com:$owner/$repo.git") ;;
    *) echo 'origin points to another repository. Stopping.' >&2; exit 1 ;;
  esac
fi
# Do not gather unknown files that may have been added beside this delivery.
git add -- .gitignore .gitattributes .vercelignore .nvmrc .github index.html 404.html robots.txt vercel.json package.json package-lock.json scripts docs README.md DEPLOY-RU.md DEPLOY.sh deployment-target.json
if ! git diff --cached --quiet; then
  git -c user.name='Website build' -c user.email='website-build@users.noreply.github.com' commit -m 'Prepare treolympus website for Vercel'
fi
if gh repo view "$owner/$repo" --json nameWithOwner >/dev/null 2>&1; then
  if ! git remote get-url origin >/dev/null 2>&1; then git remote add origin "$remote"; fi
  refs="$(git ls-remote origin)" || { echo 'Cannot read the target repository.' >&2; exit 1; }
  if [[ -n "$refs" ]]; then
    # No forced updates. Require the remote main to be an ancestor of this exact history.
    git fetch origin main
    git merge-base --is-ancestor FETCH_HEAD HEAD || { echo 'Remote contains different history. Stopping without overwrite.' >&2; exit 1; }
  fi
  git push -u origin main
else
  # If the previous lookup failed for any reason other than absence, GitHub will reject
  # this create operation; no existing repository will be overwritten.
  if git remote get-url origin >/dev/null 2>&1; then
    gh repo create "$owner/$repo" --private
    git push -u origin main
  else
    gh repo create "$owner/$repo" --private --source=. --remote=origin --push
  fi
fi

mkdir -p .vercel
node --input-type=module <<'JS'
import fs from 'node:fs';
const target=JSON.parse(fs.readFileSync('deployment-target.json','utf8'));
fs.writeFileSync('.vercel/project.json',JSON.stringify({projectId:target.vercelProjectId,orgId:target.vercelTeamId,projectName:target.vercelProjectName},null,2)+'\n');
JS
vercel git connect --yes --scope "$team"
if [[ "$mode" == '--production' ]]; then
  vercel deploy --prod --yes --scope "$team"
else
  vercel deploy --yes --scope "$team"
fi
echo 'CLI commands completed. Check the returned deployment URL and build status before declaring the domain live.'
