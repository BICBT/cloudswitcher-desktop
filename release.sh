#!/usr/bin/env bash
set -e

RELEASE_TYPE=${1:-patch}

git checkout master
git pull
npm version "${RELEASE_TYPE}"
git push && git push --tags
