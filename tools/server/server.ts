import express from 'express';
// import { exec } from 'child_process';
import { exec, spawn } from 'child_process';
const app = express();
app.use(express.json());

// 允许跨域（根据实际需求调整）
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const runTestScript = (scriptName, env, res, scripts, index) => {
  const cmdArgs = [
    'playwright', 'test', 
    `tests/ijiaoyan/${scriptName}`,
    '--headed', 
    '--project=chromium'
  ];

  console.log(`即将执行第${index + 1}个命令:`, cmdArgs.join(' '));

  const child = spawn('npx', cmdArgs, { env });

  child.stdout.on('data', (data) => {
    console.log(`[Playwright 输出] ${data}`);
  });

  child.stderr.on('data', (data) => {
    console.error(`[Playwright 错误] ${data}`);
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
      // 所有脚本执行完成
      res.json({ message: '所有脚本执行成功！' });
    }
  });
};

app.post('/run-test', (req, res) => {
  // const { resourceType, questionTypes, courseInfo } = req.body;
  // let testScript = '';
  const { resourceTypes, questionTypes, courseName, presetCourse,presetCourseText } = req.body;
  const scriptsToRun = [];
  console.log(`课程名称: ${courseName}`);
  console.log("选中的资源类型是："+resourceTypes);
  console.log("选中的预设课程设置："+presetCourseText);

  if (resourceTypes.includes('course') && courseName) {
    scriptsToRun.push('create_course.spec.ts');
  }

  if (resourceTypes.includes('exam')) {
    scriptsToRun.push('create_exam_point_model_diagram.spec.ts');
  }

  if (resourceTypes.includes('handout')) {
    scriptsToRun.push('create_handout_point_model_diagram.spec.ts');
  }

  const invalidTypes = resourceTypes.filter(type => !['course', 'exam'].includes(type));
  if (invalidTypes.length > 0) {
    return res.status(400).json({ message: `无效的资源类型：${invalidTypes.join(',')}` });
  }

  console.log(`要执行的文件数量: ${scriptsToRun.length}`);
  if (scriptsToRun.length === 0) {
    return res.status(400).json({ message: '没有需要执行的脚本' });
  }

  const processedQuestionTypes = Array.isArray(questionTypes)
    ? JSON.stringify(questionTypes)
    : questionTypes ? JSON.stringify([questionTypes]) : '[]';

  const env = {
    ...process.env,
    questionTypes: processedQuestionTypes, // 使用处理后的值
    courseName: courseName || '',
    presetCourse: presetCourse || '',
    presetCourseText: presetCourseText || ''
  };

  runTestScript(scriptsToRun[0], env, res, scriptsToRun, 0);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`服务已启动：http://localhost:${PORT}`);
});