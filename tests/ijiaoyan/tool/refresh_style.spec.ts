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
  // 开始遍历文件夹
  await traverseFolders(page, '寒假');

  // await page.waitForSelector('tbody.ant-table-tbody tr.ant-table-row', { timeout: 10000 });
  // const handout_row = await page.$$('tbody.ant-table-tbody tr.ant-table-row'); 
});

// 递归函数，用于遍历文件夹
async function traverseFolders(page, folderSelector) {
  // 点击进入当前文件夹
  await page. getByText(folderSelector).click();
  await page.waitForTimeout(3000);
  // await page.waitForSelector('tr.ant-table-row.ant-table-row-level-0');
  const tableRow = await page.$('tr.ant-table-row.ant-table-row-level-0');
  // await page.waitForTimeout(5000);
  // const tableRow = await page.$('tr.ant-table-row.ant-table-row-level-0', { timeout: 60000 });
  if (tableRow) {
    await page.waitForSelector('tbody.ant-table-tbody tr.ant-table-row', { timeout: 10000 });

    // 获取当前文件夹下的所有行
    const rows = await page.$$('tbody.ant-table-tbody tr.ant-table-row');

    let hasSubFolders = false;

    // 检查是否有子文件夹
    for (const row of rows) {
      const thirdColumn = await row.$('td:nth-child(3)');
      if (!thirdColumn) continue;
      const nameElement = await thirdColumn.$('div > span');
      if (!nameElement) continue;
      const title = await nameElement.getAttribute('title');
      if (title === '文件夹') {
        hasSubFolders = true;
        // const folder = await nameElement.textContent();
        const folder_span = await thirdColumn.$('div > div > div > span');
        const folderName = await folder_span.textContent();
        console.log('文件夹名称：', folderName);
        // if (folder) {
          // 递归调用遍历子文件夹
        await traverseFolders(page, folderName);
        // }
      }
    }

    // 如果没有子文件夹，处理文件
    if (!hasSubFolders) {

      await page.waitForSelector('tbody.ant-table-tbody tr.ant-table-row', { timeout: 10000 });
      await page.getByText('类型').first().click();
      await page.waitForTimeout(1000);
      await page.getByRole('menuitem', { name: '课程资料', exact: true }).click();
      await page.waitForTimeout(1000);

      const handout_row = await page.$$('tbody.ant-table-tbody tr.ant-table-row'); 
      console.log('找到讲义文件数量：', handout_row.length);
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
          // await page.bringToFront();
          // 关闭当前弹出的页面
          await page1.close();
          await page.bringToFront();
          await page.getByText('测试专用公共云盘').click();
          await page.getByText('zhangq测试').click();
          await page.getByText('寒假').click();
        }

      }else {
        // console.warn('未找到 tbody 中的 tr 元素，此文件夹下面没有讲义');
        console.log('未找到 tbody 中的 tr 元素，此文件夹下面没有讲义');
        await page.getByText('测试专用公共云盘').click();
        await page.getByText('zhangq测试').click();
        await page.getByText('寒假').click();
      }  
  }

  }else {
    console.log('列表中没有数据，未找到 tr.ant-table-row 元素，此文件夹下无数据');
    await page.getByText('测试专用公共云盘').click();
    await page.getByText('zhangq测试').click();
    await page.getByText('寒假').click();
    // await page.getByText('寒假').click();
  }
  

  // 返回上一级文件夹
  // await page.goBack();
}