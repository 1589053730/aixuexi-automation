import express from 'express';
import { exec } from 'child_process';
const app = express();
app.use(express.json());

// 接收前端参数，调用 Playwright 测试脚本
app.post('/start', (req, res) => {
  const { resourceType, questionTypes } = req.body;
  
  // 拼接 Playwright 命令（假设写了一个工具用例 create-tool.spec.ts）
  // 例如：npx playwright test tests/ijiaoyan/tool/create-tool.spec.ts -- --type=paper --questions=choice,fill
  const cmd = [
    'npx playwright test',
    'tests/ijiaoyan/tool/create-tool.spec.ts', // 新增的工具用例
    `-- --type=${resourceType} --questions=${questionTypes.join(',')}`
  ].join(' ');

  // 执行命令（调用自动化）
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      res.json({ success: false, msg: `执行失败：${error.message}` });
      return;
    }
    res.json({ success: true, msg: `执行完成：\n${stdout}` });
  });
});

app.listen(3000, () => {
  console.log('工具服务启动：http://localhost:3000');
  console.log('前端页面访问：http://localhost:3000/tools/ui/index.html');
});