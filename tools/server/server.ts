import express from 'express';
import { exec } from 'child_process';
const app = express();
app.use(express.json());

// 允许跨域（根据实际需求调整）
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.post('/run-test', (req, res) => {
  const { resourceType, questionTypes } = req.body;
  let testScript = '';

  // 根据资源类型选择要执行的 Playwright 测试脚本
  if (resourceType === 'exam') {
    testScript = 'create_exam.spec.ts';
  } else if (resourceType === 'course') {
    testScript = 'create_course.spec.ts';
  } else {
    return res.status(400).json({ message: '无效的资源类型' });
  }

  // 拼接 Playwright 执行命令（需确保 playwright 已全局/项目安装）
  // 示例：npx playwright test tests/ijiaoyan/create_exam.spec.ts --headed --project=chromium questionTypes=choice questionTypes=choice
  const cmd = [
    'npx', 'playwright', 'test', 
    `tests/ijiaoyan/${testScript}`,
    '--headed',  // 启用浏览器可视化模式
    '--project=chromium', // 根据实际配置选择浏览器
    `questionTypes=${questionTypes.join(',')}`
  ];

  const fullCmd = cmd.join(' ') + ' ' + `questionTypes=${questionTypes.join(',')}`;
  console.log('即将执行的命令:', fullCmd);

  exec(fullCmd, (error, stdout, stderr) => {
    if (error) {
      console.error('执行错误:', error);
      return res.json({ message: `执行失败：\n${stderr || error.message}` });
    }
    res.json({ message: `执行成功！\n${stdout}` });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`服务已启动：http://localhost:${PORT}`);
});