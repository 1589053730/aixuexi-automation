// import { test, expect } from '../../fixtures/loginf.fixture';
import dns from 'dns';
dns.setDefaultResultOrder('verbatim');
// import { test, expect } from '@playwright/test';
import { test, Page } from '@playwright/test';

test('课程库-创建课程（人教版-能力强化-暑假-2025）', async ({ page }) => {
  test.setTimeout(600000);

  // const courseName = process.env.courseName;
  // console.log(`课程名称: ${courseName}`);
  // const presetCourseText = process.env.presetCourseText;
  // console.log(`预设课程配置: ${presetCourseText}`);

  const timestamp = getTimestamp();
  const courseLessonCount = parseInt(process.env.courseLessonCount || '1', 10);
  const courseName = `ui自动化创建-${timestamp}`;
  const courseDrive = process.env.courseDrive;
  const subject = process.env.subject;

  // const courseName = "ui自动化创建01";
  // const courseLessonCount = '2';
  // const courseDrive = "测试专用课程";
  // const subject = "初中数学";

  console.log('课程名称:', courseName);
  console.log('课程讲次数量:', courseLessonCount);
  console.log('课程库课程位置: ',courseDrive);

  // 登录流程
  await page.goto('https://admin.aixuexi.com/#/home', { waitUntil: 'networkidle', timeout: 60000 });
  console.log('填写用户名和密码');
  await page.getByRole('textbox', { name: '请输入邮箱账号' }).fill('jt002@qq.com');
  await page.getByRole('textbox', { name: '请输入OA密码' }).fill('123456');
  await page.getByRole('link', { name: '登 录' }).click();
  console.log('登录点击完成');

  await page.waitForTimeout(3000);
  
  await page.goto('https://ijiaoyan.aixuexi.com/workbench.html#/', {
    waitUntil: 'domcontentloaded',
    timeout: 50000 
  });

  await page.getByRole('combobox').locator('span').nth(1).click();
  await page.screenshot({ path: 'screenshots/debug2.png' });
  await page.getByRole('option', { name: subject }).click();
  console.log('切换学科完成');
  await page.waitForLoadState('networkidle');

  await page.getByText('课程库').click();
  await page.getByText(courseDrive).click();
  await page.getByRole('button', { name: '新建课程' }).click();
  await page.getByRole('textbox', { name: '* 名称' }).click();
  await page.getByRole('textbox', { name: '* 名称' }).fill(courseName);
  await page.locator('.ant-cascader-picker-label').click();
  await page.getByRole('menuitem', { name: '教材版本 图标: right' }).click();
  await page.getByRole('menuitem', { name: '人教版' }).click();

  await page.locator('#schemeId').getByText('请选择').click();
  // cocator('div >div >div>div >ul.ant-select-dropdown-menu.ant-select-dropdown-menu-root.ant-select-dropdown-menu-vertical>li.ant-select-dropdown-menu-item ').nth(22);
  // 点击第一个下拉选项
  // await page.click('.ant-select-dropdown-menu-item:first-of-type');
  await page.getByRole('option', { name: '能力强化' }).click();
  await page.locator('#gradeId').getByText('请选择').click();
  await page.getByRole('option', { name: '初一' }).click();
  await page.locator('#period').getByText('请选择').click();
  await page.getByRole('option', { name: '暑假' }).click();
  await page.locator('#years').getByText('请选择').click();
  await page.getByRole('option', { name: '2025' }).click();
  await page.getByRole('spinbutton', { name: '* 讲次' }).click();
  await page.getByRole('spinbutton', { name: '* 讲次' }).fill(courseLessonCount.toString());
  await page.getByRole('button', { name: '确 定' }).click();

  // const fields = presetCourseText.split('/').map(field => field.trim());
  // const textbookVersion = fields[0]; // 人教版
  // const scheme = fields[1]; // 思维创新
  // const grade = fields[2]; // 初一
  // const period = fields[3]; // 暑假
  // const year = fields[4]; // 2025
  // const lessonCount = fields[5]; // 2讲
  // const courseLevel = fields[6]; // 三阶课


  // 1、创建课程
  // await page.goto('http://ijiaoyan.aixuexi.com/workbench.html#/');
  // await page.getByText('课程库').click();
  // await page.getByText('测试专用课程').click();
  // await page.getByRole('button', { name: '新建课程' }).click();
  // await page.getByRole('textbox', { name: '* 名称' }).click();
  // await page.getByRole('textbox', { name: '* 名称' }).fill(courseName);
  // await page.locator('.ant-cascader-picker-label').click();
  // await page.getByRole('menuitem', { name: '教材版本 图标: right' }).click();
  // await page.getByRole('menuitem', { name: textbookVersion }).click();
  // await page.locator('#schemeId').getByText('请选择').click();
  // await page.getByRole('option', { name: scheme }).click();
  // await page.locator('#gradeId').getByText('请选择').click();
  // await page.getByRole('option', { name: grade }).click();
  // await page.locator('#period').getByText('请选择').click();
  // await page.getByRole('option', { name: period }).click();
  // await page.locator('#years').getByText('请选择').click();
  // await page.getByRole('option', { name: year }).click();
  // await page.getByRole('spinbutton', { name: '* 讲次' }).click();
  // await page.getByRole('spinbutton', { name: '* 讲次' }).fill(lessonCount);
  // await page.getByRole('button', { name: '确 定' }).click();
});

function getTimestamp(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需+1
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}