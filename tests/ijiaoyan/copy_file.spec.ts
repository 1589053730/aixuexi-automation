import dns from 'dns';
dns.setDefaultResultOrder('verbatim');

import { test, expect } from '@playwright/test';

test('选择文件夹--复制文件夹--生产完成', async ({ page }) => {
  test.setTimeout(300000);
  // test.setTimeout(300000 * parseInt(process.env.copyCount || '1', 10)); // 按复制次数调整超时时间

  // const subject = process.env.subject;
  // const sourceDrive = process.env.sourceDrive;
  // const sourcePath = process.env.sourcePath;
  // const targetDrive = process.env.targetDrive;
  // const targetPath = process.env.targetPath;
  // const copyCount = parseInt(process.env.copyCount || '1', 10);

  // 校验 copyCount 合法性
  // if (isNaN(copyCount) || copyCount < 1) {
  //   throw new Error(`无效的复制次数 copyCount: ${process.env.copyCount}，必须是大于等于1的整数`);
  // }

  const sourcePath="/san测试/第二讲"
  const subject = "初中化学";
  const sourceDrive = "测试专用公共云盘";
  const targetDrive = "测试专用公共云盘";
  const targetPath = "/zhangq测试";
  const copyCount = 2;

  console.log('=== 环境变量配置 ===');
  console.log('科目:', subject);
  console.log('源目标:', sourceDrive);
  console.log('源文件夹路径:', sourcePath);
  console.log('源路径层级拆分:', sourcePath.split('/'));
  console.log('目标云盘:', targetDrive);
  console.log('目标文件夹路径:', targetPath);
  console.log('目标文件夹层级拆分:', targetPath.split('/'));
  console.log('复制讲次数量:', copyCount);
  console.log('====================');

  // 登录流程（只执行一次）
  await page.goto('https://admin.aixuexi.com/#/home', { waitUntil: 'networkidle', timeout: 60000 });
  console.log('填写用户名和密码');
  await page.getByRole('textbox', { name: '请输入邮箱账号' }).fill('jt002@qq.com');
  await page.getByRole('textbox', { name: '请输入OA密码' }).fill('123456');
  await page.screenshot({ path: 'screenshots/0.png' });
  await page.getByRole('link', { name: '登 录' }).click();
  console.log('登录点击完成');
  await page.screenshot({ path: 'screenshots/1.png' });
  await page.screenshot({ path: 'screenshots/2.png' });
  
  await page.goto('https://ijiaoyan.aixuexi.com/workbench.html#/', {
    waitUntil: 'networkidle',
    timeout: 20000 
  });
  await page.screenshot({ path: 'screenshots/debug1.png' });
  await page.getByRole('combobox').locator('span').nth(1).click();
  await page.screenshot({ path: 'screenshots/debug2.png' });
  await page.getByRole('option', { name: subject }).click();
  console.log('切换学科完成');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('text=生产中心', { timeout: 10000 });
  await page.getByText('生产中心').click();
  await page.getByText(sourceDrive).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots/debug3.png' });

  // 解析源路径层级（只解析一次）
  const folderLevels = sourcePath.split('/').filter(level => level.trim() !== '');
  const totalLevels = folderLevels.length;
  console.log('源路径拆分后数量:', totalLevels);

  // 解析目标路径层级（只解析一次）
  const targetPathLevels = targetPath.split('/').filter(level => level.trim() !== '');
  const targetTotalLevels = targetPathLevels.length;

  // 根据复制次数循环执行操作
  for (let copyIndex = 0; copyIndex < copyCount; copyIndex++) {
    console.log(`===== 开始第 ${copyIndex + 1}/${copyCount} 次复制操作 =====`);

    // 1. 导航到源文件夹并选中
    // 先回到源驱动器根目录（避免层级残留）
    // await page.getByText(sourceDrive).click();
    await page.locator('div.ant-layout-sider-children > ul > li > div').getByText(sourceDrive).click();
    await page.waitForTimeout(2000);

    for (const [index, folderName] of folderLevels.entries()) {
      console.log(`正在处理第 ${index + 1} 层源文件夹：${folderName}`);
      if (index < totalLevels - 1) {
        // 非最后一层 - 点击进入文件夹
        console.log(`进入文件夹: ${folderName}`);
        await page.getByText(folderName, { exact: true }).click();
        await page.waitForTimeout(1000);
      } else {
        // 最后一层 - 点击复选框选中
        console.log(`选中文件夹: ${folderName}`);
        const exactTextElement = page.getByText(folderName, { exact: true });
        const targetRow = exactTextElement.locator('..').locator('..').locator('..').locator('..').locator('..').first();
        await page.screenshot({ path: `screenshots/debug_copy_${copyIndex + 1}_select.png` });
        await targetRow.locator('input.ant-checkbox-input').click();
        await page.waitForTimeout(1000);
      }
    }

    // 2. 执行复制操作
    await page.getByRole('button', { name: '复制到' }).click();
    await page.waitForTimeout(1000);
    await page.getByLabel('复制到').getByText(targetDrive).click();
    await page.waitForTimeout(2000);
    await page.locator('div.folder-tree >> ul >> li >> span >> i >> svg').first().click();
    await page.waitForTimeout(1000);

    // 3. 选择目标文件夹路径
    for (const [index, folderName] of targetPathLevels.entries()) {
      console.log(`正在处理第 ${index + 1} 层目标文件夹：${folderName}`);
      if (index < targetTotalLevels - 1) {
        // 非最后一层 - 展开文件夹
        console.log(`展开文件夹: ${folderName}`);
        const targetSpan = page.locator(`span[title="${folderName}"]`);
        const switcherIcon = targetSpan.locator('xpath=./preceding-sibling::span[contains(@class, "ant-tree-switcher_close")]');
        await switcherIcon.click();
        await page.waitForTimeout(1000);
      } else {
        // 最后一层 - 选中目标文件夹
        console.log(`选中目标文件夹: ${folderName}`);
        const targetSpan = page.locator(`span[title="${folderName}"]`);
        await targetSpan.click();
        await page.waitForTimeout(1000);
      }
    }

    // 4. 确认复制
    await page.getByRole('button', { name: '确 定' }).click();
    console.log(`第 ${copyIndex + 1} 次复制已提交`);
    await page.waitForTimeout(3000); // 等待复制完成

    // 5. 导航到目标文件夹并执行生产完成操作
    await page.locator('div.ant-layout-sider-children > ul > li > div').getByText(targetDrive, { exact: true }).click();
    await page.waitForTimeout(2000);

    for (const [index, folderName] of targetPathLevels.entries()) {
      console.log(`进入目标文件夹层级 ${index + 1}：${folderName}`);
      await page.getByText(folderName, { exact: true }).click();
      await page.waitForTimeout(2000);
    }

    // 进入复制后的文件夹
    const targetRowOne = page.locator('tbody tr').first();
    const folderName = targetRowOne.locator('td:nth-child(3)');
    await folderName.click();
    await page.waitForTimeout(3000);

    // 批量处理生产完成
    const fileList = page.locator('tbody.ant-table-tbody tr.ant-table-row');
    const count = await fileList.count();
    console.log(`第 ${copyIndex + 1} 次复制的文件夹包含 ${count} 个文件`);

    for (let i = 0; i < count; i++) {
      const row = page.locator('tbody.ant-table-tbody tr.ant-table-row').nth(i);
      const iconMore = row.locator('td:nth-child(4) >> .list-operation >> span:nth-child(3) >> i >> svg');
      await row.hover();
      await iconMore.click();
      await page.locator('tbody').getByRole('menu').getByText('生产完成').click();
      await page.getByRole('button', { name: '生产完成' }).click();
      console.log(`第 ${copyIndex + 1} 次复制 - 第 ${i + 1}/${count} 个文件已标记生产完成`);
      await page.waitForTimeout(500);
    }

    console.log(`===== 第 ${copyIndex + 1}/${copyCount} 次操作完成 =====`);
    await page.waitForTimeout(2000); // 每次操作间隔
  }

  console.log('全部复制和生产完成操作已执行完毕');
  await page.evaluate(() => {
    alert('全部操作执行完成');
  });
});