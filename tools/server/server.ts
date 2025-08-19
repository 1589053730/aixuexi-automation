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
  const { resourceType, questionTypes, courseName, presetCourse } = req.body;
  const scriptsToRun = [];
  console.log(`课程名称: ${courseName}`);

  // 收集需要执行的脚本
  if (courseName) {
    scriptsToRun.push('create_course.spec.ts');
  }

  if (resourceType === 'exam') {
    scriptsToRun.push('create_exam_point_model_diagram.spec.ts');
  } else if (resourceType === 'course' && !courseName) {
    // 处理只选择了course类型但没有课程名称的情况（如果需要）
    // scriptsToRun.push('create_course.spec.ts');
  } else if (resourceType && resourceType !== 'course' && resourceType !== 'exam') {
    return res.status(400).json({ message: '无效的资源类型' });
  }

  console.log(`要执行的文件数量: ${scriptsToRun.length}`);
  if (scriptsToRun.length === 0) {
    return res.status(400).json({ message: '没有需要执行的脚本' });
  }

  const env = {
    ...process.env,
    questionTypes: questionTypes?.join(',') || '',
    courseName: courseName || '',
    presetCourse: presetCourse || ''
  };

  runTestScript(scriptsToRun[0], env, res, scriptsToRun, 0);

  // const courseName = req.body.courseName;
  // if(courseName !== ''){
  //   testScript = 'create_course.spec.ts';
  // }

  // 根据资源类型选择要执行的 Playwright 测试脚本
  // if (resourceType === 'exam') {
  //   testScript = 'create_exam_point_model_diagram.spec.ts';
  // } else if (resourceType === 'course') {
  //   // testScript = 'create_course.spec.ts';
  // } else {
  //   return res.status(400).json({ message: '无效的资源类型' });
  // }

  // 拼接 Playwright 执行命令 示例：npx playwright test tests/ijiaoyan/create_exam_point_model_diagram.spec.ts --headed --project=chromium questionTypes=choice
  // const cmdArgs = [
  //   'playwright', 'test', 
  //   `tests/ijiaoyan/${testScript}`,
  //   '--headed', 
  //   '--project=chromium'
  // ];

  // console.log('即将执行的命令:', cmdArgs.join(' '));

  // 启动子进程
  // const child = spawn('npx', cmdArgs, {
  // env: {
  //     ...process.env, 
  //     questionTypes: questionTypes.join(','),
  //     courseName: req.body.courseName || '', 
  //     presetCourse: req.body.presetCourse || '' 
  //   }
  // });

  // 实时捕获子进程的 stdout 并打印到主进程终端
  // child.stdout.on('data', (data) => {
  //   console.log(`[Playwright 输出] ${data}`); // 这里会打印 create_exam.spec.ts 的 console.log
  //   // 若需要，也可以实时将输出返回给前端（需用流或WebSocket）
  // });

  // 实时捕获子进程的 stderr 并打印到主进程终端
  // child.stderr.on('data', (data) => {
  //   console.error(`[Playwright 错误] ${data}`); // 打印测试中的错误日志
  // });

  // 子进程执行结束时的处理
  // child.on('close', (code) => {
  //   if (code !== 0) {
  //     return res.status(500).json({ message: `执行失败，退出码：${code}` });
  //   }
  //   res.json({ message: '执行成功！' });
  // });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`服务已启动：http://localhost:${PORT}`);
});