import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import express from 'express';
import { exec, spawn } from 'child_process';

const app = express();
const PORT = 3000;

// 中间件配置
// app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 允许跨域
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// 存储任务状态
const taskStatus = new Map<string, { completed: boolean; progress?: string }>();

const runTestScript = (scriptName, env, res, scripts, index) => {
  const cmdArgs = [
    'playwright', 'test', 
    `tests/ijiaoyan/${scriptName}`,
    '--headed', 
    '--project=chromium'
  ];

  console.log(`即将执行第${index + 1}个命令:`, cmdArgs.join(' '));

  logToFile(`执行命令: ${cmdArgs.join(' ')}`);

  const taskId = uuidv4();
  taskStatus.set(taskId, { completed: false });
  const child = spawn('npx', cmdArgs, { env });

  child.stdout?.on('data', (data) => {
        const dataStr = data.toString();
        console.log(`脚本输出: ${dataStr}`);
        logToFile(`脚本输出: ${dataStr}`);
        // 更新任务进度
        if (taskStatus.has(taskId)) {
            taskStatus.set(taskId, {
                completed: false,
                progress: dataStr.trim().slice(-100) // 保存最后100个字符作为进度
            });
        }
    });

  child.stderr?.on('data', (data) => {
        console.error(`脚本错误: ${data}`);
    });

  child.on('close', (code) => {
    if (code !== 0) {
      // 单个脚本执行失败就终止整个流程
      res.status(500).json({ 
        message: `第${index + 1}个脚本执行失败，退出码：${code}`,
        script: scriptName
      });
      return;
    }

  // 如果还有下一个脚本，继续执行
    if (index < scripts.length - 1) {
      runTestScript(scripts[index + 1], env, res, scripts, index + 1);
    } else {
      res.json({ message: '所有脚本执行成功！' });
    }
  });
};

// 日志记录函数
const logToFile = (message: string) => {
  const logPath = path.join(__dirname, 'logs');
  const logFile = path.join(logPath, 'copy_operations.log');
  
  // 确保日志目录存在
  if (!fs.existsSync(logPath)) {
    fs.mkdirSync(logPath, { recursive: true });
  }
  
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  fs.appendFile(logFile, logMessage, (err) => {
    if (err) console.error('日志写入失败:', err);
  });
  
  console.log(logMessage.trim());
};

// 执行复制操作的端点
app.post('/api/copy-folder', (req, res) => {
  try {
    
    
    const copyOptions = req.body.copyOptions;
    console.log(`data: ${copyOptions}`);

    const subject= copyOptions.subject;
    const sourceDrive= copyOptions.sourceDrive;
    const sourcePath= copyOptions.sourcePath;
    const targetDrive= copyOptions.targetDrive;
    const targetPath= copyOptions.targetPath;


    const scriptsToRun = [];
    scriptsToRun.push('copy_file.spec.ts');

    const env = {
        ...process.env,
        subject: subject || '',
        sourceDrive: sourceDrive || '',
        sourcePath: sourcePath || '',
        targetDrive: targetDrive || '',
        targetPath: targetPath || ''
    };

    runTestScript(scriptsToRun[0], env, res, scriptsToRun, 0);

    // 记录操作日志
    logToFile(`开始复制操作: 
      学科: ${copyOptions.subject},
      源: ${copyOptions.sourceDrive}${copyOptions.sourcePath},
      目标: ${copyOptions.targetDrive}${copyOptions.targetPath}
    `);
    
    // 构建传递给自动化脚本的参数
    const params = [
      `--subject="${copyOptions.subject}"`,
      `--source-drive="${copyOptions.sourceDrive}"`,
      `--source-path="${copyOptions.sourcePath}"`,
      `--target-drive="${copyOptions.targetDrive}"`,
      `--target-path="${copyOptions.targetPath}"`,
      copyOptions.options?.overwrite ? '--overwrite' : '',
      copyOptions.options?.includeSubfolders ? '--include-subfolders' : '',
      copyOptions.options?.copyPermissions ? '--copy-permissions' : ''
    ].filter(Boolean).join(' ');
    
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : '未知错误';
    logToFile(`服务器错误: ${errMsg}`);
    res.status(500).json({
      success: false,
      message: `服务器处理错误: ${errMsg}`
    });
  }
});

// 提供前端静态文件
app.use(express.static(path.join(__dirname, 'public')));

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  logToFile(`服务器启动，监听端口 ${PORT}`);
});