#!/bin/bash
# 设置环境变量，包含 node/npm/npx 的路径
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

# 进入项目目录
cd /Users/zhangq/Documents/workspaces/aixuexi-automation  

# 使用命令（无需完整路径，因为 PATH 已包含）
/usr/local/bin/npm ci
/usr/local/bin/npx playwright install --with-deps
/usr/local/bin/npx playwright test --project=create-exam