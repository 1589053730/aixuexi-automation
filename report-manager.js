const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 报告存储目录
const REPORT_DIR = path.join(__dirname, 'allure-report');

// 执行测试并保存报告
function runTestAndSaveReport() {
  // 执行测试
  execSync('npx playwright test', { stdio: 'inherit' });
  
  // 生成唯一报告ID（时间戳）
  const reportId = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
  const reportPath = path.join(REPORT_DIR, reportId);
  
  // 生成Allure报告
  execSync(`allure generate allure-results --clean -o ${reportPath}`, { stdio: 'inherit' });
  
  // 记录报告元数据
  // recordReportMetadata(reportId);
  
  console.log(`报告已保存: ${reportPath}`);
}


// 运行测试并生成报告
runTestAndSaveReport();