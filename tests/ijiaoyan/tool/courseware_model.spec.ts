/**
 * 在线课件
 * 1、历史数据文件夹下所有在线课件全部选择 “小学数学 5、6年级”模版
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// 定义已处理文件记录的存储路径
const processedFileLog = path.resolve(__dirname, 'processed_files.json');
// 定义失败文件记录路径
const failedFileLog = path.resolve(__dirname, 'failed_files.json');

// 初始化计数器 - 用于统计各类文件处理数量
const counters = {
  total: 0,                  // 本次处理的文件总数
  '课件': 0,                 // 本次处理的课件数量
  skippedTotal: 0,           // 跳过的已处理文件总数
  'skipped课件': 0,          // 跳过的已处理课件数量
  grandTotal: 0,             // 总处理文件数(本次+历史)
  'grandTotal课件': 0        // 总处理课件数(本次+历史)
};

// 初始化处理记录文件
function initProcessedLog() {
  if (!fs.existsSync(processedFileLog)) {
    fs.writeFileSync(processedFileLog, JSON.stringify({}), 'utf-8');
  }
}

// 初始化失败文件日志
function initFailedLog() {
  if (!fs.existsSync(failedFileLog)) {
    fs.writeFileSync(failedFileLog, JSON.stringify({}), 'utf-8');
  }
}

// 检查文件是否已处理
function isFileProcessed(fileType: string, fullPath: string): boolean {
  const logContent = fs.readFileSync(processedFileLog, 'utf-8');
  const processedData = JSON.parse(logContent);
  return !!processedData[fileType]?.includes(fullPath);
}

// 记录已处理文件
function markFileProcessed(fileType: string, fullPath: string) {
  const logContent = fs.readFileSync(processedFileLog, 'utf-8');
  const processedData = JSON.parse(logContent);
  
  if (!processedData[fileType]) {
    processedData[fileType] = [];
  }
  
  if (!processedData[fileType].includes(fullPath)) {
    processedData[fileType].push(fullPath);
    fs.writeFileSync(processedFileLog, JSON.stringify(processedData, null, 2), 'utf-8');
  }
}

// 记录失败文件
function markFileFailed(fileType: string, fullPath: string, error: Error) {
  try {
    let logContent = '{}';
    if (fs.existsSync(failedFileLog)) {
      logContent = fs.readFileSync(failedFileLog, 'utf-8').trim() || '{}';
    }
    const failedData = JSON.parse(logContent);

    if (!failedData[fileType]) {
      failedData[fileType] = [];
    }

    // 拆分路径为文件夹和文件名，便于查看
    const [folderPath, fileName] = fullPath.split('||');
    failedData[fileType].push({
      folderPath,
      fileName,
      fullPath,
      error: error.message,
      time: new Date().toISOString()
    });
    fs.writeFileSync(failedFileLog, JSON.stringify(failedData, null, 2), 'utf-8');
  } catch (err) {
    console.error('记录失败文件时出错:', err);
  }
}

// 获取历史处理文件总数
function getHistoricalCounts() {
  const logContent = fs.readFileSync(processedFileLog, 'utf-8');
  const processedData = JSON.parse(logContent);
  
  const counts: {total: number, '课件': number} = {
    total: 0,
    '课件': 0
  };
  
  // 计算所有类型的历史处理文件总数
  for (const [type, files] of Object.entries(processedData)) {
    if (Array.isArray(files)) {
      counts.total += files.length;
      if (type === '课件') {
        counts.课件 = files.length;
      }
    }
  }
  
  return counts;
}

const fileTypeHandlers: {
  '课件': (page: any, fileName: string, fullPath: string) => Promise<void>
} = {
  '课件': handleCourseware 
};


test('在线课件添加小数模版', async ({ page }) => {
  
  // 初始化处理记录
  initProcessedLog();
  initFailedLog(); 
//   initProgressLog(); 
  
  test.setTimeout(21600000);//6小时
  await page.goto('https://admin.aixuexi.com/#/login');
  
  // 生产环境账号密码
  await page.getByRole('textbox', { name: '请输入邮箱账号' }).fill('tester001@qq.com');
  await page.getByRole('textbox', { name: '请输入OA密码' }).fill('tk66666666');
  await page.getByRole('link', { name: '登 录' }).click();
  await page.waitForURL('https://admin.aixuexi.com/#/home');

  await page.goto('https://ijiaoyan.aixuexi.com/workbench.html#/');
  await page.getByRole('combobox').locator('span').nth(1).click();
  await page.getByRole('option', { name: '小学数学' }).click();
  await page.getByText('生产中心').click();
  await page.locator('div.ant-layout-sider-children > ul > li > div').getByText('TSM公共云盘').click();
  await page.getByText('历史数据').click();
  // await page.getByText('139-能力强化').click();
  await page.getByText('139-能力强化').click();
  // await page.getByText('48-思维突破').click();
  // await page.getByText('106-能力提高').click();
  await page.getByText('9010-2021小学数学能力强化体系苏教版').click();
//   await page.getByText('7-六年级').click();
//   await page.getByText('暑假').click();
//   await page.getByText('春季').click();
  
  // 开始遍历文件夹
  await traverseFolders(page, '7-六年级');

  // 所有文件处理完成后输出统计结果
  console.log('\n===== 文件处理统计结果 =====');
  console.log(`本次处理课件数: ${counters['课件']}`);
  console.log('-----------------------------');
  console.log(`跳过的已处理文件数: ${counters.skippedTotal}`);
  console.log(`跳过的已处理课件数: ${counters['skipped课件']}`);
  console.log('-----------------------------');
  console.log('=============================');

});

// 递归遍历文件夹
async function traverseFolders(page, folderName: string) {

  //以下代码是循环遍历所有文件夹
  console.log(`进入文件夹: ${folderName}`);
  await page.getByText(folderName, { exact: true }).click();
  await page.waitForTimeout(4000);
  await page.waitForFunction(
    () => {
      const tbody = document.querySelector('tbody.ant-table-tbody');
      return !!tbody;
    },
    {},
    { timeout: 5000 }
  );

  const rows = await page.$$('tbody.ant-table-tbody tr.ant-table-row');
  
  if (rows.length === 0) {
    console.log(`文件夹【 ${folderName} 】中没有内容，返回上一级`);
    await page.waitForTimeout(3000);
    await goBackToParentFolder(page);
    return;
  }
  
  // 收集子文件夹
  const subFolders: string[] = [];
  for (const row of rows) {
    const thirdColumn = await row.$('td:nth-child(3)');
    if (!thirdColumn) continue;
    
    const nameElement = await thirdColumn.$('div > span');
    if (!nameElement) continue;
    const title = await nameElement.getAttribute('title');
    
    if (title === '文件夹') {
      const folderSpan = await thirdColumn.$('div > div > div > span');
      const subFolderName = await folderSpan.textContent() ?? '';
      if (subFolderName.trim() !== '') {
        subFolders.push(subFolderName.trim());
      }
    }
  }
  
  // 递归处理子文件夹
  for (const subFolder of subFolders) {
    await traverseFolders(page, subFolder);
  }
  
  // 依次处理不同类型的文件
  for (const [fileType, handler] of Object.entries(fileTypeHandlers)) {
    await processFilesByType(page, folderName, subFolders, fileType, handler);
  }
  
  console.log(`文件夹【 ${folderName} 】处理完成，返回上一级`);
  console.log("*****************************************************");

  await goBackToParentFolder(page);
}

// 按文件类型处理文件的通用方法
async function processFilesByType(page, folderPath: string, subFolders: string[], fileType: string, handler: (page: any, fileName: string, fullPath: string) => Promise<void>) {
  console.log(`开始处理文件夹:  ${folderPath}  中的【 ${fileType} 】`);
  
  // 切换文件类型筛选
  await page.getByText('类型').first().waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('.diy-dropdown-trigger > .anticon > svg').first().click();
  await page.getByRole('menuitem', { name: fileType, exact: true }).waitFor({ state: 'visible', timeout: 5000 });
  await page.getByRole('menuitem', { name: fileType, exact: true }).click();
  await page.waitForTimeout(3000);
  
  // 获取筛选后的文件行
  const fileRows = await page.$$('tbody.ant-table-tbody tr.ant-table-row');
  const validFiles: string[] = [];
  
  // 筛选有效文件
  for (const row of fileRows) {
    const thirdColumn = await row.$('td:nth-child(3)');
    if (!thirdColumn) continue;
    
    const nameElement = await thirdColumn.$('div > div > div > span');
    if (!nameElement) continue;
    
    const fileName = await nameElement.textContent() ?? '';
    const trimmedFileName = fileName.trim();
    
    if (trimmedFileName && !subFolders.includes(trimmedFileName)) {
      validFiles.push(trimmedFileName);
    }
  }
  
  console.log(`文件夹: ${folderPath}  中找到【 ${validFiles.length} 】个 ${fileType} 文件`);
  
  if (validFiles.length === 0) {
    console.log(`文件夹: ${folderPath}   中没有  ${fileType} 文件`);
    return;
  }

  // 调用对应类型的处理函数
  for (const fileName of validFiles) {

    const fullPath = `${folderPath}||${fileName}`;

    if (isFileProcessed(fileType, fullPath)) {
      // 累计跳过的文件
      counters.skippedTotal++;
      counters[`skipped${fileType}`]++;
      console.log(`文件【 ${fullPath} 】已处理，跳过。当前已跳过${counters.skippedTotal}个文件`);
      continue;
    }
    
    let newPage;
    try {
        newPage = await handler(page, fileName, fullPath);
        markFileProcessed(fileType, fullPath);

        // 处理成功后计数器+1
        counters[fileType]++;
        counters.total++;
        console.log(`当前累计一共处理 : ${counters.total}, ${fileType}: ${counters[fileType]}`);
    } catch (error) {
        console.error(`处理文件【 ${folderPath} 】失败:`, error);
        if (newPage) {
          await newPage.close().catch(err => console.error('关闭页面失败:', err));
        }

        // 记录失败但不中断循环
        markFileFailed(fileType, fullPath, error as Error);
        // 增加页面恢复逻辑
        if (!page.isClosed()) {
            await page.bringToFront().catch(err => console.error('切换到主页面失败:', err));
            await page.waitForTimeout(2000); // 等待2秒再处理下一个文件
      }

    }
    }
  }


// 在线课件处理
async function handleCourseware(page, fileName: string, fullPath: string) {
  console.log(`开始处理在线课件： ${fileName}`);

  // 点击文件前先确认主页面未被关闭
  if (page.isClosed()) {
    throw new Error("主页面已关闭，无法处理课件");
  }

  try {
    await page.getByText(fileName, { exact: true }).click();
    await page.waitForTimeout(4000);
        
    // 检查目标元素是否存在
    const targetElement = page.locator('div').filter({ hasText: /^小学数学小学数学5，6年级$/ }).getByRole('img');
    const elementExists = await targetElement.isVisible({ timeout: 10000 }).catch(() => false);

    if (!elementExists) {
        console.log(`在线课件：【${fileName}】已处理过（目标元素不存在），直接标记为已处理`);
        
        markFileProcessed('课件', fullPath);
        // 获取当前所有页面
        const pages = page.context().pages();
        // 过滤出除主页面外的其他页面（新打开的页面）
        const newPages = pages.filter(p => p !== page);

        // 关闭所有新打开的页面
        for (const newPage of newPages) {
            if (!newPage.isClosed()) {
            await newPage.close().catch(err => 
                console.error(`关闭新页面失败: ${err.message}`)
            );
            }
        }

        await page.bringToFront();
        return ;
    }

  // 元素存在时才执行操作
  await targetElement.click();

  await page.getByRole('button', { name: '确 定' }).click();
  await page.waitForTimeout(4000);

  const pagePromise = page.waitForEvent('popup');
  try {
        const modelPage = await pagePromise;
        // await modelPage.waitForLoadState('networkidle');
        console.log(`在线课件： 【 ${fileName} 】处理完成`);
        await modelPage.close();
        await page.bringToFront();
        return modelPage;
  } catch (err) {
        console.error(`等待弹出窗口失败: ${err.message}`);
        // 即使弹出窗口未出现，也视为处理完成，避免流程中断
        // 获取当前所有页面
        const pages = page.context().pages();
        // 过滤出除主页面外的其他页面（新打开的页面）
        const newPages = pages.filter(p => p !== page);

        // 关闭所有新打开的页面
        for (const newPage of newPages) {
            if (!newPage.isClosed()) {
            await newPage.close().catch(err => 
                console.error(`关闭新页面失败: ${err.message}`)
            );
            }
        }

        await page.bringToFront();
        return;
    }


  } catch (error) {
    console.error(`处理课件【${fileName}】时出错:`, error);
    // 检查页面是否仍然可用
    if (page.isClosed()) {
      throw new Error("主页面已关闭，无法继续处理");
    }
    throw error;
  }
  
}

// 返回上一级文件夹方法保持不变
async function goBackToParentFolder(page) {

  if (page.isClosed()) {
    console.error("页面已关闭，无法返回上一级");
    return;
  }

  const breadcrumbContainer = page.locator('.ant-breadcrumb');

  try {
    await breadcrumbContainer.waitFor({
      timeout: 15000,
      state: 'visible'
    });
  } catch (error) {
    console.error("等待面包屑容器失败：", error);
    // 记录错误到失败日志
    markFileFailed('系统操作', '返回上一级文件夹', new Error(`等待面包屑容器失败: ${error.message}`));
    // 尝试刷新页面后继续（可选的补救措施）
    await page.reload({ waitUntil: 'networkidle' }).catch(err => 
      console.error("刷新页面失败:", err)
    );
    return;
    
  }

  try {
    const breadcrumbLinksLocator = breadcrumbContainer.locator(
        '.ant-breadcrumb-link:not(.ant-breadcrumb-link-disabled)'
    );
    const linkCount = await breadcrumbLinksLocator.count();
    if (linkCount < 2) {
        console.warn('没有足够的面包屑层级，无法返回上一级');
        markFileFailed('系统操作', '返回上一级文件夹', new Error('没有足够的面包屑层级'));
        return;
    }

    const parentLinkLocator = breadcrumbLinksLocator.nth(linkCount - 2);
    await parentLinkLocator.waitFor({
        timeout: 5000,
        state: 'visible'
    });

    await Promise.all([
        page.waitForNavigation({
            timeout: 20000,
            waitUntil: 'networkidle'
        }),
        parentLinkLocator.click({
            timeout: 5000,
            delay: 100,
            button: 'left'
        })
    ]);
  }catch (error) {
    // 捕获后续操作中的错误
    console.error("点击返回上一级失败：", error.message);
    markFileFailed('系统操作', '返回上一级文件夹', new Error(`点击返回失败: ${error.message}`));
    // 可选：再次尝试刷新页面
    await page.reload({ waitUntil: 'networkidle' }).catch(err => 
      console.error("刷新页面失败:", err)
    );
  }
  
  
}