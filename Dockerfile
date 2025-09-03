# 使用Playwright官方镜像，它已经预装了所有需要的浏览器和Node.js环境
FROM mcr.microsoft.com/playwright:node-20.12.2-jammy

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json（如果存在）
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 复制TypeScript配置文件
COPY tsconfig.json ./

# 复制源代码
COPY . .

# 安装Playwright浏览器（虽然镜像已包含，但确保版本匹配）
RUN npx playwright install --with-deps

# 编译TypeScript代码
RUN npm run build || echo "If no build script, we'll handle it differently"

# 暴露应用程序端口（如果你的Express应用需要）
EXPOSE 3000

# 默认命令：启动应用程序（根据你的实际需求修改）
# 如果没有特定的启动命令，可以保留为bash以便交互式使用
CMD ["/bin/bash"]