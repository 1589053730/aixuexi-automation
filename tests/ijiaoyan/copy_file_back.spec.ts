// 在你的 test 文件或启动脚本的最顶部添加
import dns from 'dns';
// 设置Node.js不进行DNS缓存，始终重新查询
dns.setDefaultResultOrder('verbatim');

// import { test, expect } from '../../fixtures/loginf.fixture';
import { test, expect } from '@playwright/test';

// test('选择文件夹--复制文件夹--生产完成', async ({ loggedInPage: page }) => {
test('选择文件夹--复制文件夹--生产完成', async ({ page }) => {

  test.setTimeout(300000);

  const subject = process.env.subject;
  const sourceDrive = process.env.sourceDrive;
  const sourcePath = process.env.sourcePath;
  const targetDrive = process.env.targetDrive;
  const targetPath = process.env.targetPath;
  const copyCount = process.env.copyCount;
  // const sourcePath="/san测试/第八讲"
  // const subject = "初中化学";
  // const sourceDrive = "测试专用公共云盘";
  // const targetDrive = "测试专用公共云盘";
  // const targetPath = "/zhangq测试"


  console.log('科目:', subject);
  console.log('源目标:', sourceDrive);
  console.log('源文件夹路径:', sourcePath);
  console.log('源路径层级拆分:', sourcePath.split('/'));
  console.log('目标云盘:', targetDrive);
  console.log('目标文件夹路径:', targetPath);
  console.log('目标文件夹层级拆分:', targetPath.split('/'));
  console.log('复制讲次数量:', copyCount);

  await page.goto('https://admin.aixuexi.com/#/home', { waitUntil: 'networkidle', timeout: 60000 });
  console.log('填写用户名和密码');
  await page.getByRole('textbox', { name: '请输入邮箱账号' }).fill('jt002@qq.com');
  await page.getByRole('textbox', { name: '请输入OA密码' }).fill('123456');
  // await page.getByRole('textbox', { name: '请输入邮箱账号' }).fill('tester001@qq.com');
  // await page.getByRole('textbox', { name: '请输入OA密码' }).fill('tk66666666');
  await page.screenshot({ path: '0.png' });
  await page.getByRole('link', { name: '登 录' }).click();
  console.log('登录点击完成');
  await page.screenshot({ path: '1.png' });
  // await page.waitForURL('https://admin.aixuexi.com/#/home');
  await page.screenshot({ path: '2.png' });
  
  // await page.goto('https://ijiaoyan.aixuexi.com/workbench.html#/');
  await page.goto('https://ijiaoyan.aixuexi.com/workbench.html#/', {
    waitUntil: 'networkidle', // 等待网络空闲（无网络请求）
    timeout: 20000 
  });
  // await page.waitForTimeout(3000);
  await page.screenshot({ path: 'debug1.png' });
  await page.getByRole('combobox').locator('span').nth(1).click();
  await page.screenshot({ path: 'debug2.png' });
  await page.getByRole('option', { name: subject }).click();
  console.log('切换学科完成');
  // await page.waitForTimeout(3000);
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('text=生产中心', { timeout: 10000 });
  await page.getByText('生产中心').click();
  // await page.screenshot({ path: 'debug4.png' });
  await page.getByText(sourceDrive).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'debug3.png' });

  const folder_levels = sourcePath.split('/').filter(level => level.trim() !== '');
  const total_levels = folder_levels.length;
  console.log('源路径拆分后数量:', total_levels);
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
      await page.screenshot({ path: 'debug5.png' });
      await target_row.locator('input.ant-checkbox-input').click(); 
    }
  }

  await page.getByRole('button', { name: '复制到' }).click();
  await page.getByLabel('复制到').getByText(targetDrive).click();
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

  //去复制好的目标文件夹给每个文件点击 生产完成
  await page.locator('div.ant-layout-sider-children > ul > li > div').getByText(targetDrive, { exact: true }).click();
  await page.waitForTimeout(2000);
  for (const [index, folderName] of target_path_folder_levels.entries()) {
    console.log(`进入复制完整的文件夹开始准备点击 生产完成，正在处理第 ${index + 1} 层文件夹：${folderName}`);
    if (index < target_path_total_levels - 1) {
      // 非最后一层 - 点击进入文件夹
      console.log(`进入文件夹: ${folderName}`);
      await page.getByText(folderName,{ exact: true }).click();
    } else {
      // 最后一层
      const exactTextElement = page.getByText(folderName, { exact: true });
      await exactTextElement.click();
      console.log(`进入文件夹: ${folderName}`);
      await page.waitForTimeout(3000);
    }
  }


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
  // const rows = await page.$$('tbody.ant-table-tbody tr.ant-table-row');
  const count = await file_list.count();
  console.log(`文件总数量: ${count}`);

  for (let i = 0; i < count; i++) {
    const row = page.locator('tbody.ant-table-tbody tr.ant-table-row').nth(i);
    const iconMore = row.locator('td:nth-child(4) >> .list-operation >> span:nth-child(3) >> i >> svg');
    await row.hover();
    await iconMore.click();
    await page.locator('tbody').getByRole('menu').getByText('生产完成').click();
    await page.getByRole('button', { name: '生产完成' }).click();
    console.log('第' +i +"文件 生产完成");
  }

  console.log('完成全部文件点击 生产完成');
  await page.evaluate(() => {
        alert('全部操作执行完成');
      });
  
});
