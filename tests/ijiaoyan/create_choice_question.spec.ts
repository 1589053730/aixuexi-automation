import { test, expect } from '../../fixtures/loginf.fixture';
// import { test, expect } from '@playwright/test';
import type { Locator } from '@playwright/test';

test('添加选择题（知识图谱-试题-新建选择题-审核通过-资源查看-添加资源-设置标签-发布）', async ({ loggedInPage: page }) => {
  const timestamp = new Date().getTime();
  const choiceQuestionName = `ui-test-${timestamp}-选择题（）`;
  console.log(`题干名称: ${choiceQuestionName}`);

  await page.goto('https://ijiaoyan.aixuexi.com/workbench.html#/');
  await page.getByText('知识图谱').click();
  await page.getByText('试题', { exact: true }).click();
  await page.getByTitle('ui').click();
  await page.locator('[id="260295"]').getByText('选择题').click();
  // await page.getByText('ui-test-choice').click();
  await page.getByRole('treeitem', { name: '锚 ui-test-choice' }).getByRole('img').click();
  await page.locator('[id="1052052"]').getByText('ui-test-model-choice').click();

  //1、开始编辑题目信息
  const page1Promise = page.waitForEvent('popup');
  await page.getByRole('button', { name: '新增试题' }).click();

  await page.getByRole('button', { name: '选择题' }).first().click();
  const page1 = await page1Promise;
  
  // const contentDiv = page1.locator('div.content');
  const questionStemDiv = page1.locator('div.content > div > div > div > div.ck-5-content.ck.ck-content.ck-editor__editable.ck-rounded-corners.ck-editor__editable_inline.ck-blurred ').first();
  await questionStemDiv.fill(choiceQuestionName);

  const optionA = page1.locator('div.content > div > div > div > div.ck-blurred.ck-5-content.ck.ck-content.ck-editor__editable.ck-rounded-corners.ck-editor__editable_inline ').first();
  await optionA.fill('A+');
  const optionB = page1.locator('div.content > div > div > div > div.ck-blurred.ck-5-content.ck.ck-content.ck-editor__editable.ck-rounded-corners.ck-editor__editable_inline ').nth(1);
  await optionB.fill('B+');
  const optionC = page1.locator('div.content > div > div > div > div.ck-blurred.ck-5-content.ck.ck-content.ck-editor__editable.ck-rounded-corners.ck-editor__editable_inline ').nth(2);
  await optionC.fill('C+');
  const optionD = page1.locator('div.content > div > div > div > div.ck-blurred.ck-5-content.ck.ck-content.ck-editor__editable.ck-rounded-corners.ck-editor__editable_inline ').nth(3);
  await optionD.fill('D+');

  await page1.getByRole('checkbox', { name: 'A' }).check();

  const analysis = page1.locator('div.content > div > div > div > div.ck-blurred.ck-5-content.ck.ck-content.ck-editor__editable.ck-rounded-corners.ck-editor__editable_inline ').nth(4);
  await analysis.fill('ui-test-这是解析');
  const summary = page1.locator('div.content > div > div > div > div.ck-blurred.ck-5-content.ck.ck-content.ck-editor__editable.ck-rounded-corners.ck-editor__editable_inline ').nth(5);
  await summary.fill('ui-test-这是小结');
  const fenxi = page1.locator('div.content > div > div > div > div.ck-blurred.ck-5-content.ck.ck-content.ck-editor__editable.ck-rounded-corners.ck-editor__editable_inline ').nth(6);
  await summary.fill('ui-test-这是分析');
  const comment = page1.locator('div.content > div > div > div > div.ck-blurred.ck-5-content.ck.ck-content.ck-editor__editable.ck-rounded-corners.ck-editor__editable_inline ').nth(7);
  await comment.fill('ui-test-这是点评');
  await page1.getByRole('radio', { name: '图标: star 图标: star' }).nth(1).click();
  // await page1.getByRole('radio', { name: '图标: star 图标: star' }).nth(1).click();

  await page1.getByRole('button', { name: '保 存' }).click();
  await page1.getByRole('button', { name: '提 交' }).click();
  await page1.goto('https://ijiaoyan.aixuexi.com/knowledge-graph.html#/topic-review');
  // const question_row = await page.locator('.ant-table-fixed >.ant-table-tbody >.ant-table-row').first();
  const question_row = await page1.locator('td:nth-child(7)').first();
  // await page1.locator('td:nth-child(7)').first().click();
  // const question_row_text = await question_row.locator('td').nth(7).textContent();
  const question_row_text = await question_row.textContent();
  if(question_row_text === "jt002@qq.com"){
    await page1.getByRole('button', { name: '审核', exact: true }).first().click();
    await page1.getByRole('button', { name: '提 交' }).click();
  }else{
    console.log('此题目不是自动化创建，请注意查看');
  }

  //2、发布试题
  await page1.getByText('资源查看').click();

  await page1.getByText('ui', { exact: true }).click();
  await page1.getByText('选择题').click();
    // await page.getByRole('treeitem', { name: '选择题' }).getByRole('img').first().click();

  await page1.getByRole('treeitem', { name: '锚 ui-test-choice' }).getByRole('img').click();
  await page1.locator('[id="1052052"]').getByText('ui-test-model-choice').click();
  // await page1.locator('[id="1052052"]').getByText('ui-test-model-choice').click();
  await page1.getByText('新知学', { exact: true }).click();
  await page1.getByText('添加资源').click();
  await page1.getByRole('menuitem', { name: '题', exact: true }).click();

  const ancestorLocator = page1.locator(`//*[text()="${choiceQuestionName}"]/ancestor::div[contains(@class, 'rsc-topic-box')][1]`);
  await ancestorLocator.locator('label:has-text("例题")').click();

  await page1.getByRole('button', { name: '确 定' }).click();
  await page1.getByText('发布').nth(0).click();

  console.log(`题目：${choiceQuestionName}，发布成功`);
});