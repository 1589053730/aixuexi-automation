# 使用 Playwright 官方镜像作为基础镜像，它已经包含了 Node.js、Playwright 及其浏览器依赖
FROM mcr.microsoft.com/playwright:v1.55.0

# 设置工作目录
WORKDIR /app

# 安装 Java 和 Allure 依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-17-jre \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# 配置 Java 环境变量
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH=$JAVA_HOME/bin:$PATH

# 安装 Allure 命令行工具
RUN curl -o allure-2.25.0.zip -L https://github.com/allure-framework/allure2/releases/download/2.25.0/allure-2.25.0.zip \
    && unzip allure-2.25.0.zip -d /opt/ \
    && ln -s /opt/allure-2.25.0/bin/allure /usr/bin/allure \
    && rm allure-2.25.0.zip

# 验证安装
RUN java -version && allure --version


# 将项目文件复制到容器中
COPY package.json package-lock.json* ./
# COPY tools/ ./tools/
# COPY tools/ui /app/tools/ui
COPY tools/ ./tools/
COPY playwright.config.ts ./
COPY tests/ ./tests/
COPY fixtures/ ./fixtures/
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
CMD ["npx", "ts-node", "tools/server/server.ts"]