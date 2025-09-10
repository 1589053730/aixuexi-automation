// import { test, expect } from '../../fixtures/loginf.fixture';

import dns from 'dns';
dns.setDefaultResultOrder('verbatim');
import { test, expect } from '@playwright/test';

test('课程库-创建课程（人教版-思维创新-初一-暑假-2025）', async ({ page }) => {

  const courseName = process.env.courseName;
  console.log(`课程名称: ${courseName}`);
  const presetCourseText = process.env.presetCourseText;
  console.log(`预设课程配置: ${presetCourseText}`);

  const fields = presetCourseText.split('/').map(field => field.trim());
  const textbookVersion = fields[0]; // 人教版
  const scheme = fields[1]; // 思维创新
  const grade = fields[2]; // 初一
  const period = fields[3]; // 暑假
  const year = fields[4]; // 2025
  const lessonCount = fields[5]; // 2讲
  const courseLevel = fields[6]; // 三阶课


  // 1、创建课程
  await page.goto('http://ijiaoyan.aixuexi.com/workbench.html#/');
  await page.getByText('课程库').click();
  await page.getByText('测试专用课程').click();
  await page.getByRole('button', { name: '新建课程' }).click();
  await page.getByRole('textbox', { name: '* 名称' }).click();
  await page.getByRole('textbox', { name: '* 名称' }).fill(courseName);
  await page.locator('.ant-cascader-picker-label').click();
  await page.getByRole('menuitem', { name: '教材版本 图标: right' }).click();
  await page.getByRole('menuitem', { name: textbookVersion }).click();
  await page.locator('#schemeId').getByText('请选择').click();
  await page.getByRole('option', { name: scheme }).click();
  await page.locator('#gradeId').getByText('请选择').click();
  await page.getByRole('option', { name: grade }).click();
  await page.locator('#period').getByText('请选择').click();
  await page.getByRole('option', { name: period }).click();
  await page.locator('#years').getByText('请选择').click();
  await page.getByRole('option', { name: year }).click();
  await page.getByRole('spinbutton', { name: '* 讲次' }).click();
  await page.getByRole('spinbutton', { name: '* 讲次' }).fill(lessonCount);
  await page.getByRole('button', { name: '确 定' }).click();
  // await page.getByText('未绑定讲次文件').click();
  // await page.getByRole('button', { name: '绑定配件' }).click();
  // await page.getByText('ui自动化测试文件夹').click();
  // await page.getByRole('row', { name: '60339 试卷 ui-' }).getByRole('button').click();
  // await page.getByRole('button', { name: '保存预览' }).click();
  // await page.getByRole('button', { name: '返回' }).click();
  // await page.getByText('测试专用课程').click();
  // await page.getByRole('cell', { name: '发布至管理中心' }).locator('svg').first().click();
  // await page.getByRole('button', { name: '发 布' }).click();
});