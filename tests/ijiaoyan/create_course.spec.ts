import { test, expect } from '../../fixtures/loginf.fixture';

test('课程库-创建课程（人教版-思维创新-初一-暑假-2025）', async ({ page }) => {

  const timestamp = new Date().getTime();
  const examName = `ui-test-course_${timestamp}`;
  console.log(`创建的课程名称: ${examName}`);

  // 1、创建课程
  await page.goto('http://ijiaoyan.aixuexi.com/workbench.html#/');
  await page.getByText('课程库').click();
  await page.getByText('测试专用课程').click();
  await page.getByRole('button', { name: '新建课程' }).click();
  await page.getByRole('textbox', { name: '* 名称' }).click();
  await page.getByRole('textbox', { name: '* 名称' }).fill(examName);
  await page.locator('.ant-cascader-picker-label').click();
  await page.getByRole('menuitem', { name: '教材版本 图标: right' }).click();
  await page.getByRole('menuitem', { name: '人教版' }).click();
  await page.locator('#schemeId').getByText('请选择').click();
  await page.getByRole('option', { name: '思维创新' }).click();
  await page.locator('#gradeId').getByText('请选择').click();
  await page.getByRole('option', { name: '初一' }).click();
  await page.locator('#period').getByText('请选择').click();
  await page.getByRole('option', { name: '暑假' }).click();
  await page.locator('#years').getByText('请选择').click();
  await page.getByRole('option', { name: '2025' }).click();
  await page.getByRole('spinbutton', { name: '* 讲次' }).click();
  await page.getByRole('spinbutton', { name: '* 讲次' }).fill('1');
  await page.getByRole('button', { name: '确 定' }).click();
  await page.getByText('未绑定讲次文件').click();
  await page.getByRole('button', { name: '绑定配件' }).click();
  await page.getByText('ui自动化测试文件夹').click();
  await page.getByRole('row', { name: '60339 试卷 ui-' }).getByRole('button').click();
  await page.getByRole('button', { name: '保存预览' }).click();
  await page.getByRole('button', { name: '返回' }).click();
  await page.getByText('测试专用课程').click();
  await page.getByRole('cell', { name: '发布至管理中心' }).locator('svg').first().click();
  await page.getByRole('button', { name: '发 布' }).click();
});