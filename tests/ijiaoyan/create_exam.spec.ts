import { test, expect } from '../../fixtures/loginf.fixture';

test('创建试卷-添加题目-保存发布-生产完成', async ({ loggedInPage: page }) => {
  test.setTimeout(90000);
  
  const timestamp = new Date().getTime();
  const examName = `ui-test_${timestamp}`;
  console.log(`生成的试卷名称: ${examName}`);

  // 1. 创建试卷
  await page.goto('https://ijiaoyan.aixuexi.com/workbench.html#/');
  await page.waitForLoadState('networkidle');
  await page.getByText('生产中心').click();
  await page.getByText('测试专用公共云盘').click();
  await page.getByText('ui自动化测试文件夹').click();
  await page.getByRole('button', { name: '新建' }).click();
  await page.getByText('试卷', { exact: true }).click();
  await page.getByRole('textbox', { name: '* 名称:' }).click();
  await page.getByRole('textbox', { name: '* 名称:' }).fill(examName);
  await page.locator('.ant-cascader-picker-label').click();
  await page.getByRole('menuitem', { name: '教材版本 图标: right' }).click();
  await page.getByRole('menuitem', { name: '人教版' }).click();
  await page.locator('#GRADE').getByText('请选择选项').click();
  await page.getByRole('option', { name: '初一' }).click();
  await page.locator('#TERM').getByText('请选择选项').click();
  await page.getByRole('option', { name: '暑假' }).click();
  await page.locator('#SCHEME').getByText('请选择选项').click();
  await page.getByRole('option', { name: '思维创新' }).click();
  await page.locator('#bizType').getByText('请选择选项').click();
  await page.getByRole('option', { name: '课堂落实' }).click();
  await page.getByRole('button', { name: '下一步,选择模版' }).click();
  await page.locator('.img-box').first().click();
  const page1Promise = page.waitForEvent('popup');
  await page.getByRole('button', { name: '完 成' }).click();

  const page1 = await page1Promise;
  await page1.waitForLoadState('domcontentloaded'); // 优先等待DOM加载完成
  const mainFrame = page1.frameLocator('iframe').first();
  //点击资源库图标，其他方式总是失败，暂时用Xpath，但是不建议
  await mainFrame.locator('xpath=//*[@id="root"]/div/div[2]/div[2]/div/div[2]/div[4]/div/div/i').click();
  const resourceFrame = mainFrame.frameLocator('iframe').first();
  await resourceFrame.locator('.add-btn').first().click();
  //此处点击第一道题目等待3s，是因为页面有bug，连续快速点击两次"添加题目"页面会出现白屏，导致后面操作元素无法找到，刷新页面可跳过这个bug
  await page.waitForTimeout(3000);
  // await page1.locator('iframe').contentFrame().locator('iframe').contentFrame().locator('.add-btn').first().click();
  await page1.locator('iframe').contentFrame().getByRole('tabpanel').locator('iframe').contentFrame().locator('div:nth-child(2) > .action-toolbar > .bottom-right > .user-tool > .add-btn').click();

  //点击"分值"图标
  await mainFrame.locator('xpath=//*[@id="root"]/div/div[2]/div[2]/div/div[2]/div[2]/div/div/i').click();
  await page1.locator('iframe').contentFrame().getByRole('button', { name: '自动分配分数' }).click();
  await page1.locator('iframe').contentFrame().getByRole('button', { name: '保 存' }).click();
  await page1.locator('iframe').contentFrame().getByRole('button', { name: '发 布' }).click();
  await page1.close();

  // 4. 切换回原页面
  await page.bringToFront();
  const target_row = page.locator(
            `tbody tr:has-text("${examName}")`  
        ).first();
  target_row.hover();
  const icon_more = target_row.locator(
            'td:nth-child(4) >> .list-operation >> span:nth-child(3) >> i >> svg'
        );
  await icon_more.click();
  await page.locator('tbody').getByRole('menu').getByText('生产完成').click();
  await page.getByRole('button', { name: '生产完成' }).click();
  const status_elem = target_row.locator(
            'td:nth-child(11)'
        );
  await expect(status_elem).toHaveText('已完成');
});
