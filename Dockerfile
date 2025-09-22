# 使用 Playwright 官方镜像作为基础镜像，它已经包含了 Node.js、Playwright 及其浏览器依赖
FROM mcr.microsoft.com/playwright:v1.55.0

# 设置工作目录
WORKDIR /app

# 将项目文件复制到容器中
COPY package.json package-lock.json* ./
# COPY tools/ ./tools/
# COPY tools/ui /app/tools/ui
COPY tools/ ./tools/
COPY playwright.config.ts ./
COPY tests/ ./tests/
COPY fixtures/ ./fixtures/

# 假设 tsconfig.json 和其他必要的源文件也需要复制
COPY tsconfig.json ./

# 安装项目依赖（包括 TypeScript）
RUN npm install

# 将 Node.js 代码编译成 JavaScript
RUN npx tsc --build

# 暴露应用程序运行的端口
EXPOSE 3001



# 设置环境变量
# ENV NODE_ENV=production

# 启动命令，使用 node 运行编译后的 JavaScript 文件，或者直接使用 ts-node
# 根据实际启动文件路径修改
CMD ["npx", "ts-node", "tools/server/copy_server.ts"]