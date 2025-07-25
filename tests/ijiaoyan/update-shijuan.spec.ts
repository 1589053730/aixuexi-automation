import { test, expect } from '@playwright/test';

test('update exam paper', async ({ page }) => {
  // 1. 登录流程
  await page.goto('https://admin.aixuexi.com/#/login');
  await page.getByRole('textbox', { name: '请输入邮箱账号' }).click();
  await page.getByRole('textbox', { name: '请输入邮箱账号' }).fill('jt002@qq.com');
  await page.getByRole('textbox', { name: '请输入邮箱账号' }).press('Tab');
  await page.getByRole('textbox', { name: '请输入OA密码' }).fill('123456');
  await page.getByRole('link', { name: '登 录' }).click();
  // 2. 验证是否登录成功
  await expect(page).toHaveURL('https://admin.aixuexi.com/#/home');

  await page.goto('https://ijiaoyan.aixuexi.com/workbench.html#/');
  await page.getByText('生产中心').click();
  await page.getByText('测试专用公共云盘').click();
  await page.getByText('zhangq测试生产中心').click();
  const page1Promise = page.waitForEvent('popup');
  // 3. 打开试卷编辑页面
  await page.getByText('zhangq测试试卷19').click();
  const page1 = await page1Promise;
  await page1.waitForLoadState('domcontentloaded');
  const mainFrame = page1.frameLocator('iframe').first();
  //点击资源库图标，其他方式总是失败，暂时用Xpath，但是不建议
  await mainFrame.locator('xpath=//*[@id="root"]/div/div[2]/div[2]/div/div[2]/div[4]/div/div/i').click();
  const resourceFrame = mainFrame.frameLocator('iframe').first();
  await resourceFrame.locator('.add-btn').first().click();
  //此处点击第一道题目等待3s，是因为页面有bug，连续快速点击两次"添加题目"页面会出现白屏，导致后面操作元素无法找到，刷新页面可跳过这个bug
  await page.waitForTimeout(3000);
  // await page1.locator('iframe').contentFrame().locator('iframe').contentFrame().locator('.add-btn').first().click();
  await page1.locator('iframe').contentFrame().getByRole('tabpanel').locator('iframe').contentFrame().locator('div:nth-child(2) > .action-toolbar > .bottom-right > .user-tool > .add-btn').click();

  // 打印所有iframe信息
  // console.log('Frames:', page1.frames().map(f => f.url()));
  //点击"分值"图标
  await mainFrame.locator('xpath=//*[@id="root"]/div/div[2]/div[2]/div/div[2]/div[2]/div/div/i').click();
  await page1.locator('iframe').contentFrame().getByRole('button', { name: '自动分配分数' }).click();
  await page1.locator('iframe').contentFrame().getByRole('button', { name: '保 存' }).click();
  await page1.locator('iframe').contentFrame().getByRole('button', { name: '发 布' }).click();
  await page1.close();

  // 4. 切换回原页面
  await page.bringToFront();
  await page.pause();
  const target_row = page.locator(
            'tbody tr:has-text("zhangq测试试卷19")'  
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
  // await expect(status_elem).toMatchAriaSnapshot(`- text: 已完成`);

});