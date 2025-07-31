import { test, expect } from '@playwright/test';

test('一键替换新样式', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('https://admin.aixuexi.com/#/login');
  //生产环境账号密码
  await page.getByRole('textbox', { name: '请输入邮箱账号' }).fill('tester001@qq.com');
  await page.getByRole('textbox', { name: '请输入OA密码' }).fill('tk66666666');
  await page.getByRole('link', { name: '登 录' }).click();
  await page.waitForURL('https://admin.aixuexi.com/#/home');

  await page.goto('https://ijiaoyan.aixuexi.com/workbench.html#/');
  await page.getByRole('combobox').locator('span').nth(1).click();
  await page.getByRole('option', { name: '小学数学' }).click();
  await page.getByText('生产中心').click();
  await page.getByText('测试专用公共云盘').click();
  await page.getByText('zhangq测试').click();
  await page.getByText('寒假').click();
  // await page.getByText('一键替换新样式').click();

  await page.waitForSelector('tbody.ant-table-tbody tr.ant-table-row', { timeout: 10000 });
  const handout_row = await page.$$('tbody.ant-table-tbody tr.ant-table-row'); 
  // await page.getByText('类型').first().click();
  // await page.getByRole('menuitem', { name: '课程资料', exact: true }).click();
  // console.log('找到讲义文件数量：', handout_row.length); 
  if (handout_row.length > 0) {
    for (const row of handout_row) {
        const page1Promise = page.waitForEvent('popup');
        const thirdColumn = await row.$('td:nth-child(3)'); 
        if (!thirdColumn) continue;
        //定位到讲义名称
        const name = await thirdColumn.$('div > div > div > span');
        if (!name) continue;
        const handoutName = await name.textContent();
        if (handoutName) {
          console.log('开始操作讲义：', handoutName);
        }
        await name.click();

        const page1 = await page1Promise;
        const newPageUrl = page1.url();
        console.log(`讲义名称：${handoutName}，原始新页面地址：`, newPageUrl);

        const updatedUrl = `${page1.url()}&batchReplace=1`;
        console.log(`讲义名称：${handoutName}，追加参数后的地址：`, updatedUrl);

        // 导航到新地址（需要刷新两次）
        await page1.goto(updatedUrl, { 
          waitUntil: 'domcontentloaded'  // 只等DOM加载完成，不等图片/资源
        });
        await page1.reload({ waitUntil: 'domcontentloaded' });

        await page1.locator('iframe').contentFrame().getByRole('button', { name: '刷样式' }).click();
        await page1.locator('iframe').contentFrame().getByRole('button', { name: '确 认' }).click();

        // 等待10秒
        await page1.waitForTimeout(10000);
        await page1.locator('iframe').contentFrame().getByRole('button', { name: '保 存' }).click();
        console.log(`${handoutName}   已经完成刷新样式操作`);

        // 关闭当前弹出的页面
        await page1.close();
        await page.bringToFront();
    }

  }else {
    console.warn('未找到 tbody 中的 tr 元素');
    }  
  
});