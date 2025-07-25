#!/bin/bash
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
cd /Users/zhangq/Documents/workspaces/aixuexi-automation  
npm ci
npx playwright install --with-deps
npx playwright test --project=create-exam