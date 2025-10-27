import path from 'path';
import fs from 'fs';

import express from 'express';
import { exec, spawn, execSync } from 'child_process';
import cors from 'cors';
import { rimrafSync } from 'rimraf';

const app = express();
const PORT = 3001;
const REPORT_DIR = path.join(__dirname, 'allure-report'); 
const API_TITLE_MAP = {
  'create_exam': '创建试卷',
  'create_course': '创建课程',
  'copy-folder': '创建课程并绑定配件'
};

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


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.options('/api/copy-folder', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200); 
});


const runTestScript = (scriptName, env, res, scripts, index, apiName) => {
  // const { rimrafSync } = require('rimraf');
  rimrafSync('allure-results'); // 清理之前的测试结果
  // const cmdArgs = [
  //   'playwright', 'test', 
  //   `tests/ijiaoyan/${scriptName}`,
  //   '--headed', 
  //   '--project=chromium',
  //   '--config=./playwright.config.ts'
  //   // ,
  //   // '--debug'
  // ];

  // linux
  const cmdArgs = [
    'playwright', 'test', 
    `tests/ijiaoyan/${scriptName}`,
    '--project=chromium',
    '--config=./playwright.config.ts'
  ];

  console.log(`即将执行第${index + 1}个命令:`, cmdArgs.join(' '));

  logToFile(`执行命令: ${cmdArgs.join(' ')}`);

  const child = spawn('npx', cmdArgs, { env });

  child.stdout?.on('data', (data) => {
        const dataStr = data.toString();
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

    // 测试成功后生成报告
    if (index === scripts.length - 1) {
      const reportId = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
      const reportPath = path.join(REPORT_DIR, reportId);
      
      execSync(`allure generate allure-results --clean -o ${reportPath}`, { stdio: 'inherit' });
      recordReportMetadata(reportId, apiName);
      
      res.json({
        success: true,
        message: '脚本执行成功，报告已生成！'
      });
    } else {
      // 如果还有下一个脚本，继续执行
        if (index < scripts.length - 1) {
          runTestScript(scripts[index + 1], env, res, scripts, index + 1, apiName);
        } else {
          res.json({
            success: true,
            message: '所有脚本执行成功！'
          });
        }
    }
  });
};

// 记录报告元数据
function recordReportMetadata(reportId, apiName) {
  const metadataPath = path.join(REPORT_DIR, 'report-metadata.json');
  const metadata = fs.existsSync(metadataPath) 
    ? JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
    : [];
  
  // 从allure结果中提取统计信息
  const stats = getReportStats();

  // 根据apiName获取标题，默认使用"未知用例"
  const title = API_TITLE_MAP[apiName] || '未知用例';
  
  metadata.push({
    id: reportId,
    datetime: new Date().toLocaleString(),
    title: title,
    ...stats
  });
  
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
}

// 获取报告统计信息
function getReportStats() {
  try {
    // 指向根目录下的allure-results
    const resultsDir = path.join(process.cwd(), 'allure-results');
    
    // 检查结果目录是否存在
    if (!fs.existsSync(resultsDir)) {
      console.warn('未找到allure-results目录，使用默认统计数据');
      return { total: 0, passed: 0, failed: 0, status: 'unknown' };
    }

    // 获取所有result.json文件
    const resultFiles = fs.readdirSync(resultsDir)
      .filter(file => file.endsWith('-result.json'));

    if (resultFiles.length === 0) {
      console.warn('allure-results目录下未找到测试结果文件，使用默认统计数据');
      return { total: 0, passed: 0, failed: 0, status: 'unknown' };
    }

    // 初始化统计数据
    let total = 0;
    let passed = 0;
    let failed = 0;
    let broken = 0;
    let skipped = 0;

    // 遍历所有结果文件计算统计
    resultFiles.forEach(file => {
      const filePath = path.join(resultsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const result = JSON.parse(content);

      total++;
      
      switch (result.status) {
        case 'passed':
          passed++;
          break;
        case 'failed':
          failed++;
          break;
        case 'broken':
          broken++;
          break;
        case 'skipped':
          skipped++;
          break;
        default:
          console.log(`未知状态: ${result.status} (文件: ${file})`);
      }
    });

    // 计算整体状态
    let status = 'success';
    if (failed > 0 || broken > 0) {
      status = 'failed';
    } else if (skipped > 0) {
      status = 'skipped';
    }

    return {
      total,
      passed,
      failed: failed + broken, // 合并失败和错误的用例数
      skipped,
      status
    };
  } catch (error) {
    console.error('解析测试统计信息失败:', error);
    return { total: 0, passed: 0, failed: 0, status: 'error' };
  }
}

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

// 执行复制和绑定课程配将操
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
    
    runTestScript(scriptsToRun[0], env, res, scriptsToRun, 0, 'copy-folder');
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

// 只创建课程
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
    
    runTestScript(scriptsToRun[0], env, res, scriptsToRun, 0, 'create_course');

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

//创建试卷并添加对应题型
app.post('/api/create_exam', (req, res) => {
  try {

    const createOptions = req.body.createOptions;
    const subject= createOptions.subject;
    const questionTypes = createOptions.questionTypes;
    const questionCount = createOptions.questionCount;

    console.log(`subject:`,subject);
    console.log(`questionTypes: ${JSON.stringify(questionTypes)}`);

    const processedQuestionTypes = Array.isArray(questionTypes)
      ? JSON.stringify(questionTypes)
      : questionTypes ? JSON.stringify([questionTypes]) : '[]';

    const scriptsToRun = ['create_exam_point_model_diagram.spec.ts'];

    const env = {
      ...process.env,
      subject: subject,
      questionTypes: processedQuestionTypes,
      questionCount: questionCount
    };
    
    runTestScript(scriptsToRun[0], env, res, scriptsToRun, 0, 'create_exam');

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

//获取报告列表
app.get('/api/reports', (req, res) => {
  const metadataPath = path.join(REPORT_DIR, 'report-metadata.json');
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    res.json(metadata);
  } else {
    res.json([]);
  }
});

// 提供前端静态文件
app.use('/tools/ui', express.static('tools/ui'));
// app.use('/tools/ui', express.static(path.join(__dirname, '../ui')));
app.use('/allure-report', express.static(path.join(__dirname, 'allure-report')));


// 启动服务器
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  logToFile(`服务器启动，监听端口 ${PORT}`);
});
server.setTimeout(600000); // 设置为 10 分钟