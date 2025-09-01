import { test, expect } from '../../fixtures/loginf.fixture';

test('复制文件夹-保存发布-生产完成', async ({ loggedInPage: page }) => {

  test.setTimeout(1800000);

//   const subject = process.env.subject;
//   const sourceDrive = process.env.sourceDrive;
//   const sourcePath = process.env.sourcePath;
//   const targetDrive = process.env.targetDrive;
  // const targetPath = process.env.targetPath;
  const sourcePath="zhangq测试/第一讲"
  const subject = "初中化学";
  const sourceDrive = "测试专用公共云盘";
  const targetDrive = "测试专用公共云盘";
  const targetPath = "zhangq测试"


  console.log('科目:', subject);
  console.log('源文件夹路径:', sourcePath);
  console.log('源路径层级拆分:', sourcePath.split('/'));

  await page.goto('https://ijiaoyan.aixuexi.com/workbench.html#/');
  await page.getByRole('combobox').locator('span').nth(1).click();
  await page.getByRole('option', { name: subject }).click();
  await page.getByText('生产中心').click();
  await page.getByText(sourceDrive).click();

  const folder_levels = sourcePath.split('/').filter(level => level.trim() !== '');
  const total_levels = folder_levels.length;
  for (const [index, folderName] of folder_levels.entries()) {
    console.log(`正在处理第 ${index + 1} 层文件夹：${folderName}`);
    if (index < total_levels - 1) {
      // 非最后一层 - 点击进入文件夹
      console.log(`进入文件夹: ${folderName}`);
      await page.getByText(folderName,{ exact: true }).click();
    } else {
      // 最后一层 - 点击复选框选中
      console.log(`选中文件夹: ${folderName}`);

      const exactTextElement = page.getByText(folderName, { exact: true });
      // 2. 向上找到它的父级 tr去点击复选框
      const target_row = exactTextElement.locator('..').locator('..').locator('..').locator('..').locator('..').first(); 
      await target_row.locator('input.ant-checkbox-input').click(); 
    }

  }

  await page.getByRole('button', { name: '复制到' }).click();
  await page.getByLabel('复制到').getByText(targetDrive).click();
  // await page.getByRole('dialog', { name: '复制到' }).locator('svg').first().click();
  await page.waitForTimeout(2000);
  await page.locator('div.folder-tree >> ul >> li >> span >> i >> svg').first().click();

  const target_path_folder_levels = targetPath.split('/').filter(level => level.trim() !== '');
  const target_path_total_levels = target_path_folder_levels.length;
  for (const [index, folderName] of target_path_folder_levels.entries()) {
    console.log(`正在处理第 ${index + 1} 层文件夹：${folderName}`);
    if (index < target_path_total_levels - 1) {
      // 非最后一层 - 点击进入文件夹
      console.log(`进入文件夹: ${folderName}`);
      const target_span = page.locator(`span[title="${folderName}"]`);
      const switcher_icon = target_span.locator('xpath=./preceding-sibling::span[contains(@class, "ant-tree-switcher_close")]');
      await switcher_icon.click();

    } else {
      // 最后一层 - 点击复选框选中
      console.log(`选中文件夹: ${folderName}`);
      const targetSpan = page.locator(`span[title="${folderName}"]`);
      await targetSpan.click();
    }
  }

  await page.getByRole('button', { name: '确 定' }).click();
  await page.waitForTimeout(3000);
  const target_row_one = page.locator(
            `tbody tr`  
        ).first();
  const folder_name = target_row_one.locator(
            'td:nth-child(3)'
        );
  await folder_name.click();
  await page.waitForTimeout(3000);

  const file_list = page.locator(
            'tbody.ant-table-tbody tr.ant-table-row'  
        );
  const rows = await page.$$('tbody.ant-table-tbody tr.ant-table-row');
  const count = await file_list.count();
  console.log(`文件总数量: ${count}`);

  for (let i = 0; i < count; i++) {
    const row = page.locator('tbody.ant-table-tbody tr.ant-table-row').nth(i);
    const iconMore = row.locator('td:nth-child(4) >> .list-operation >> span:nth-child(3) >> i >> svg');
    await row.hover();
    await iconMore.click();
    await page.locator('tbody').getByRole('menu').getByText('生产完成').click();
    await page.getByRole('button', { name: '生产完成' }).click();
  }
  
});
