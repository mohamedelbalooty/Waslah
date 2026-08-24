#!/bin/sh
# Ignored Build Step for the Waslah web project (Vercel dashboard:
# Settings -> Git -> Ignored Build Step -> paste `sh scripts/vercel-ignore-api-only.sh`).
#
# Contract (contracts/ci-pipeline.md): an API-only change must not trigger a web build.
# Exit 0 => Vercel SKIPS the build. Exit non-zero => build proceeds.
#
# Web builds fire only when these paths changed in the latest push:
#   apps/web/** or shared packages (packages/**)
git diff --quiet "HEAD^" "HEAD" -- apps/web packages || exit 1
exit 0
