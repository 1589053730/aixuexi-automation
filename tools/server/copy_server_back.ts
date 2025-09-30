import path from 'path';
import fs from 'fs';

import express from 'express';
import { exec, spawn } from 'child_process';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors({
  origin: [
    'http://127.0.0.1:3001', 
    'http://localhost:3001',
    'http://127.0.0.1:3000'
  ],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  optionsSuccessStatus: 200 
}));


// 中间件配置
// app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.options('/api/copy-folder', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200); 
});


const runTestScript = (scriptName, env, res, scripts, index) => {
  const cmdArgs = [
    'playwright', 'test', 
    `tests/ijiaoyan/${scriptName}`,
    '--headed', 
    '--project=chromium',
    '--config=./playwright.config.ts'
    // ,
    // '--debug'
  ];

  // linux
  // const cmdArgs = [
  //   'playwright', 'test', 
  //   `tests/ijiaoyan/${scriptName}`,
  //   '--project=chromium',
  //   '--config=./playwright.config.ts'
  // ];

  console.log(`即将执行第${index + 1}个命令:`, cmdArgs.join(' '));

  logToFile(`执行命令: ${cmdArgs.join(' ')}`);

  const child = spawn('npx', cmdArgs, { env });

  child.stdout?.on('data', (data) => {
        const dataStr = data.toString();
        // console.log(`脚本输出: ${dataStr}`);
        logToFile(`脚本输出: ${dataStr}`);
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
      res.json({
        success: true,
        message: '所有脚本执行成功！'
      });
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
    const copyCount= copyOptions.copyCount;
    const courseLessonCount = copyOptions.courseLessonCount;
    const courseDrive = copyOptions.courseDrive;
  
    const scriptsToRun = [];
    scriptsToRun.push('copy_file.spec.ts');

    const env = {
        ...process.env,
        subject: subject || '',
        sourceDrive: sourceDrive || '',
        sourcePath: sourcePath || '',
        targetDrive: targetDrive || '',
        targetPath: targetPath || '',
        copyCount: copyCount || '',
        courseLessonCount: courseLessonCount || '',
        courseDrive: courseDrive || ''
    };

    const originalCallback = (result) => {
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    };
    
    runTestScript(scriptsToRun[0], env, res, scriptsToRun, 0);
    // runTestScript(scriptsToRun[0], env, { ...res, end: originalCallback }, scriptsToRun, 0);

    logToFile(`开始复制操作: 
      学科: ${copyOptions.subject},
      源: ${copyOptions.sourceDrive}${copyOptions.sourcePath},
      目标: ${copyOptions.targetDrive}${copyOptions.targetPath}
    `);
    
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

// 只创建课程的端点
app.post('/api/create_course', (req, res) => {
  try {
    const createOptions = req.body.createOptions;
    console.log(`data: ${JSON.stringify(createOptions)}`);

    const subject= createOptions.subject;
    const courseLessonCount = createOptions.courseLessonCount;
    const courseDrive = createOptions.courseDrive;
  
    const scriptsToRun = ['create_course.spec.ts'];

    const env = {
        ...process.env,
        subject: subject || '',
        courseLessonCount: courseLessonCount || '',
        courseDrive: courseDrive || ''
    };
    
    runTestScript(scriptsToRun[0], env, res, scriptsToRun, 0);

    logToFile(`开始创建课程: 
      学科: ${createOptions.subject},
      课程库云盘: ${createOptions.courseDrive},
      讲次数量: ${createOptions.courseLessonCount}
    `);
    
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : '未知错误';
    logToFile(`服务器错误: ${errMsg}`);
    res.status(500).json({
      success: false,
      message: `服务器处理错误: ${errMsg}`
    });
  }
});

//创建试卷添加对应题型
app.post('/api/create_exam', (req, res) => {
  try {

    const createOptions = req.body.createOptions;
    const subject= createOptions.subject;
    const questionTypes = createOptions.questionTypes;
    const questionCount = createOptions.questionCount;

    // const { resourceTypes, questionTypes } = req.body;
    console.log(`subject:`,subject);
    console.log(`questionTypes: ${JSON.stringify(questionTypes)}`);

    const processedQuestionTypes = Array.isArray(questionTypes)
      ? JSON.stringify(questionTypes)
      : questionTypes ? JSON.stringify([questionTypes]) : '[]';

    // 处理资源类型数据
    // const processedResourceTypes = Array.isArray(resourceTypes)
    //   ? JSON.stringify(resourceTypes)
    //   : resourceTypes ? JSON.stringify([resourceTypes]) : '[]';

  
    const scriptsToRun = ['create_exam_point_model_diagram.spec.ts'];

    // 准备环境变量，传递给脚本
    const env = {
      ...process.env,
      subject: subject,
      questionTypes: processedQuestionTypes,
      questionCount: questionCount
    };
    
    runTestScript(scriptsToRun[0], env, res, scriptsToRun, 0);

    // 记录日志
    logToFile(`开始创建试卷: 
      题型: ${JSON.stringify(questionTypes)}
    `);
    
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
app.use('/tools/ui', express.static('tools/ui'));
// app.use('/tools/ui', express.static(path.join(__dirname, '../ui')));





// app.listen(PORT, '0.0.0.0',() => {
//   console.log(`服务器运行在 http://localhost:${PORT}`);
//   logToFile(`服务器启动，监听端口 ${PORT}`);
// });
// 启动服务器
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  logToFile(`服务器启动，监听端口 ${PORT}`);
});
server.setTimeout(600000); // 设置为 10 分钟