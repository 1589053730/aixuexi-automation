/**
 * 一、批量处理多层文件夹内的课程资料、日积月累、融会贯通文件
 * 课程资料：
 * 1、拼接url方式，老diy样式刷新成新diy样式
 * 
 * 日积月累样式调整
 * 1、更换属性模版
 * 2、添加讲次标题，调整标题位置到最顶部
 * 3、替换标题名称为日积月累文件名称
 * 
 * 融汇贯通样式调整：
 * 1、更换属性模版
 * 2、添加讲次标题，调整标题位置到最顶部
 * 3、替换标题名称为融汇贯通文件名称
 * 4、添加试卷信息，调整位置到标题下面
 * 5、每一道题后面添加订正栏
 * 
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// 定义已处理文件记录的存储路径
const processedFileLog = path.resolve(__dirname, 'processed_three_files.json');
// 定义失败文件记录路径
const failedFileLog = path.resolve(__dirname, 'failed_three_files.json');
// 定义跳过文件记录路径
const skippedFileLog = path.resolve(__dirname, 'skipped_three_files.json');

// 初始化计数器 - 用于统计各类文件处理数量
const counters = {
  total: 0,
  totalSkipped: 0, // 所有类型文件的总跳过数
  success: {
    '课程资料': 0,
    '日积月累': 0,
    '融会贯通': 0
  },
  failed: {
    '课程资料': 0,
    '日积月累': 0,
    '融会贯通': 0
  },
  skipped: {
    '课程资料': 0,
    '日积月累': 0,
    '融会贯通': 0
  }
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

// 初始化跳过文件日志
function initSkippedLog() {
  if (!fs.existsSync(skippedFileLog)) {
    fs.writeFileSync(skippedFileLog, JSON.stringify({}), 'utf-8');
  }
}

// 检查文件是否已处理
function isFileProcessed(fileType: string, fileName: string): boolean {
  const logContent = fs.readFileSync(processedFileLog, 'utf-8');
  const processedData = JSON.parse(logContent);
  return !!processedData[fileType]?.includes(fileName);
}

// 记录已处理文件
function markFileProcessed(fileType: string, fileName: string) {
  const logContent = fs.readFileSync(processedFileLog, 'utf-8');
  const processedData = JSON.parse(logContent);
  
  if (!processedData[fileType]) {
    processedData[fileType] = [];
  }
  
  if (!processedData[fileType].includes(fileName)) {
    processedData[fileType].push(fileName);
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

    const [folderPath, fileName] = fullPath.split('||');
    failedData[fileType].push({
      folderPath,
      fileName,
      fullPath,
      error: error.message,
      stack: error.stack,
      time: new Date().toISOString()
    });
    fs.writeFileSync(failedFileLog, JSON.stringify(failedData, null, 2), 'utf-8');
  } catch (err) {
    console.error('记录失败文件时出错:', err);
  }
}

// 记录跳过的文件
function markFileSkipped(fileType: string, fileName: string) {
  try {
    let logContent = '{}';
    if (fs.existsSync(skippedFileLog)) {
      logContent = fs.readFileSync(skippedFileLog, 'utf-8').trim() || '{}';
    }
    const skippedData = JSON.parse(logContent);

    if (!skippedData[fileType]) {
      skippedData[fileType] = [];
    }

    skippedData[fileType].push({
      fileName,
      time: new Date().toISOString()
    });
    fs.writeFileSync(skippedFileLog, JSON.stringify(skippedData, null, 2), 'utf-8');
  } catch (err) {
    console.error('记录跳过文件时出错:', err);
  }
}

// 定义文件类型和对应处理函数的映射
const fileTypeHandlers = {
  '课程资料': handleCourseMaterial,
  '日积月累': handleDailyAccumulation,
  '融会贯通': handleIntegration
};

test('课程资料、日积月累、融会贯通 刷新样式', async ({ page }) => {
  
  // 初始化处理记录
  initProcessedLog();
  initFailedLog(); 
  initSkippedLog();
  
  test.setTimeout(21600000);
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
  await page.getByText('测试专用公共云盘').click();
  await page.getByText('zhangq测试').click();
  await page.getByText('106-能力提高').click();
  
  // 开始遍历文件夹
  await traverseFolders(page, '106-能力提高');

  // 所有文件处理完成后输出统计结果
  console.log('\n===== 文件处理统计结果 =====');
  console.log(`总处理文件数: ${counters.total}`);
  console.log(`总跳过文件数: ${counters.totalSkipped}`);
  console.log('\n成功处理数:');
  Object.entries(counters.success).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  console.log('\n处理失败数:');
  Object.entries(counters.failed).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  console.log('\n跳过处理数:');
  Object.entries(counters.skipped).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  console.log('============================');
});

// 递归遍历文件夹
async function traverseFolders(page, folderName: string) {
  
  console.log(`进入文件夹: ${folderName}`);
  
  await page.getByText(folderName).click();
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
async function processFilesByType(page, folderPath: string, subFolders: string[], fileType: string, handler: (page, fileName: string, fullPath: string) => Promise<void>) {
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

    if (isFileProcessed(fileType, fileName)) {
      counters.skipped[fileType]++;
      counters.totalSkipped++; // 累加总跳过数
      console.log(`文件【 ${fullPath} 】已处理，跳过。当前${fileType}跳过数: ${counters.skipped[fileType]}, 总跳过数: ${counters.totalSkipped}`);
      markFileSkipped(fileType, fileName);
      continue;
    }
    
    let newPage; // 存储当前打开的页面引用
    try {
        newPage = await handler(page, fileName, fullPath); // 处理函数返回新页面引用
        markFileProcessed(fileType, fullPath);

        // 处理成功后计数器+1
        counters.success[fileType]++;
        counters.total++;
        // console.log(`当前累计一共处理 : ${counters.total}, 其中 ${fileType} 成功: ${counters.success[fileType]}`);
        // 原代码中对应的日志输出行修改为：
        console.log(`当前累计一共处理: ${counters.total}, 其中 ${fileType} 成功: ${counters.success[fileType]}, 失败: ${counters.failed[fileType]} (成功+失败=${counters.success[fileType] + counters.failed[fileType]})`);
        

    } catch (error) {
        console.error(`处理文件【 ${folderPath} 】失败:`, error);
        if (newPage) {
          await newPage.close().catch(err => console.error('关闭页面失败:', err)); // 关闭失败的文件页面
        }
        // 记录失败并更新计数器
        markFileFailed(fileType, fullPath, error as Error);
        // 增加页面恢复逻辑
        if (!page.isClosed()) {
            await page.bringToFront().catch(err => console.error('切换到主页面失败:', err));
            await page.waitForTimeout(2000); // 等待2秒再处理下一个文件
          }
        counters.failed[fileType]++;
        counters.total++;
      }
    }

  }

// 课程资料处理逻辑
async function handleCourseMaterial(page, fileName: string) {
  console.log(`开始处理 课程资料： ${fileName}`);

  const pagePromise = page.waitForEvent('popup');
  await page.getByText(fileName, { exact: true }).click();
  const newPage = await pagePromise;
  
  const updatedUrl = `${newPage.url()}&batchReplace=1`; 
  await newPage.goto(updatedUrl, { waitUntil: 'domcontentloaded' });
  await newPage.reload({ waitUntil: 'domcontentloaded' });
  
  await newPage.locator('iframe').contentFrame().getByRole('button', { name: '刷样式' }).click();
  await newPage.locator('iframe').contentFrame().getByRole('button', { name: '确 认' }).click();
  
  await newPage.waitForTimeout(10000);
  await newPage.locator('iframe').contentFrame().getByRole('button', { name: '保 存' }).click();
  
  console.log(`课程资料 ：“ ${fileName} “处理完成`);
  
  await newPage.close();
  await page.bringToFront();
  return newPage; // 返回页面引用
}

// 日积月累处理逻辑（更换模版、添加标题）
async function handleDailyAccumulation(page, fileName: string) {
  console.log(`开始处理 日积月累： ${fileName} `);

  const pagePeriodPromise = page.waitForEvent('popup');
  await page.getByText(fileName, { exact: true }).click();
  const newPagePeriodPromise = await pagePeriodPromise;
  //1、定位属性icon - 更换模版
  const attributeFrame = newPagePeriodPromise.locator('iframe').contentFrame().locator('div.content-opts > div.o-bar > div > div > div.o-icon').first();
  await attributeFrame.click();
  await newPagePeriodPromise.locator('iframe').contentFrame().getByText('更换模板').click();
  await newPagePeriodPromise.locator('iframe').contentFrame().locator('div').filter({ hasText: /^25-日积月累选 择$/ }).getByRole('button').click();
  //关闭属性选择框
  await newPagePeriodPromise.locator('iframe').contentFrame().locator('div').filter({ hasText: /^属性设置$/ }).locator('svg').click();

  const firstQuestion = newPagePeriodPromise.locator('iframe').contentFrame().locator('div.content-clip').first();
  await firstQuestion.click();

  //2、定位样式icon - 添加讲次标题
  const titleSelector = 'div.slb-lesson-name.flex > div > span.flex > div.text-input';
  const titleElementsCount = await newPagePeriodPromise.locator('iframe').contentFrame().locator(titleSelector).count();

  if (titleElementsCount === 0) {
    const styleFrame = newPagePeriodPromise.locator('iframe').contentFrame().locator('div.content-opts > div.o-bar > div > div > div.o-icon').nth(2);
    await styleFrame.click();
    await newPagePeriodPromise.locator('iframe').contentFrame().locator('div').filter({ hasText: /^讲次名称\(25年\)添加$/ }).getByRole('button').click();
    await newPagePeriodPromise.locator('iframe').contentFrame().locator('#root div').filter({ hasText: /^样式库$/ }).locator('use').click();
    await page.waitForTimeout(2000);

    //获取讲次的动态id，用于向上移动一次点击
    const titleStyle = newPagePeriodPromise.locator('iframe').contentFrame().locator('div.content-clip').nth(1);
    const parentTitleStyleDiv = titleStyle.locator('xpath=..');
    const titleId = await parentTitleStyleDiv.getAttribute('id'); 

    //3、替换讲次标题名称为文件名称
    const titleTextEle = newPagePeriodPromise.locator('iframe').contentFrame().locator('div.slb-lesson-name.flex > div > span.flex > div.text-input');
    await titleTextEle.fill(fileName);

    //点击讲次标题向上移动一次（讲次标题移动到最顶部）
    const titleDiv = await newPagePeriodPromise.locator('iframe').contentFrame().locator('div.slb-lesson-name.flex');
    await titleDiv.hover();
    await newPagePeriodPromise.locator('iframe').contentFrame().locator('.slb-lesson-name').click();
    await newPagePeriodPromise.locator('iframe').contentFrame().locator(`[id="${titleId}"] svg`).nth(1).click();
  }

  if (titleElementsCount !== 0) {
    console.log(`日积月累：【 ${fileName} 】已处理过（标题元素已存在），关闭页面并跳过`);
    // 关闭当前文件页面
    await newPagePeriodPromise.close().catch(err => console.error(`关闭文件【 ${fileName} 】失败:`, err));
    // 切换回主页面
    await page.bringToFront();
    // 更新跳过计数器
    counters.skipped['日积月累']++;
    counters.totalSkipped++;
    // 记录跳过日志
    markFileSkipped('日积月累', fileName);
    // 终止当前函数，继续处理下一个文件
    return newPagePeriodPromise;
  }
  
  await newPagePeriodPromise.locator('iframe').contentFrame().getByRole('button', { name: '保 存' }).click();
  await newPagePeriodPromise.locator('iframe').contentFrame().getByRole('button', { name: '发 布' }).click();
  
  console.log(`日积月累 ：“ ${fileName} “处理完成`);
  await newPagePeriodPromise.close();
  await page.bringToFront();
  return newPagePeriodPromise;
}

//融汇贯通处理逻辑
async function handleIntegration(page, fileName: string) {
  console.log(`开始处理 融会贯通： ${fileName}`);

  const pageIntegratePromise = page.waitForEvent('popup');
  await page.getByText(fileName, { exact: true }).click();
  const integratePromise = await pageIntegratePromise;

  //1、定位属性icon - 更换模版
  const attributeFrame = integratePromise.locator('iframe').contentFrame().locator('div.content-opts > div.o-bar > div > div > div.o-icon').first();
  await attributeFrame.click();
  await integratePromise.locator('iframe').contentFrame().getByText('更换模板').click();
  await integratePromise.locator('iframe').contentFrame().locator('div').filter({ hasText: /^25-融会贯通选 择$/ }).getByRole('button').click();
  //关闭属性选择框
  await integratePromise.locator('iframe').contentFrame().locator('div').filter({ hasText: /^属性设置$/ }).locator('svg').click();

  const firstQuestion = integratePromise.locator('iframe').contentFrame().locator('div.content-clip').first();
  await firstQuestion.click();

  //2、定位样式icon，添加试卷信息
  const examClipSelector = 'div.slb-examinee-info-xxsx';
  const examClipElementsCount = await integratePromise.locator('iframe').contentFrame().locator(examClipSelector).count();
  const styleFrame = integratePromise.locator('iframe').contentFrame().locator('div.content-opts > div.o-bar > div > div > div.o-icon').nth(2);
  await styleFrame.click();

  if (examClipElementsCount === 0) {
    
    await integratePromise.locator('iframe').contentFrame().locator('div').filter({ hasText: /^试卷信息\(25年\)添加$/ }).getByRole('button').click();
    await integratePromise.locator('iframe').contentFrame().locator('#root div').filter({ hasText: /^样式库$/ }).locator('use').click();
    await integratePromise.waitForTimeout(3000);
    //获取试卷信息的动态id，用于向上移动一次点击
    const examClip = integratePromise.locator('iframe').contentFrame().locator('div.content-clip').nth(1);
    const examParentDiv = examClip.locator('xpath=..');
    const examId = await examParentDiv.getAttribute('id'); 

    const examDiv = await integratePromise.locator('iframe').contentFrame().locator('div.slb-examinee-info-xxsx');
    await examDiv.hover();
    await integratePromise.locator('iframe').contentFrame().locator(`[id="${examId}"] svg`).nth(1).click();
    await integratePromise.waitForTimeout(2000);

    //定位到试卷信息栏，目的在下面添加讲次标题，然后讲次标题只需要移动一次就可以
    await examDiv.click();
  }

  if (examClipElementsCount !== 0) {
    console.log(`融会贯通：【 ${fileName} 】已处理过（标题元素已存在），关闭页面并跳过`);
    // console.log(`-----------------------------------------`);
    // 关闭当前文件页面
    await integratePromise.close().catch(err => console.error(`关闭文件【 ${fileName} 】失败:`, err));
    // 切换回主页面
    await page.bringToFront();
    // 更新跳过计数器
    counters.skipped['融会贯通']++;
    counters.totalSkipped++;
    // 记录跳过日志
    markFileSkipped('融会贯通', fileName);
    // 终止当前函数，继续处理下一个文件
    return integratePromise;
  }

  //3、定位样式icon - 添加讲次标题
  await styleFrame.click();
  await integratePromise.locator('iframe').contentFrame().locator('div').filter({ hasText: /^讲次名称\+考生信息\(25年\)添加$/ }).getByRole('button').click();
  await integratePromise.locator('iframe').contentFrame().locator('#root div').filter({ hasText: /^样式库$/ }).locator('svg').click();
  await integratePromise.waitForTimeout(3000);

  //3、替换讲次标题名称为文件名称
  const titleSelector = 'div.slb-lesson-name-con.flex > span.flex > div.text-input';
  const titleElementsCount = await integratePromise.locator('iframe').contentFrame().locator(titleSelector).count();

  const titleTextEle = integratePromise.locator('iframe').contentFrame().locator('div.slb-lesson-name-con.flex > span.flex > div.text-input');
  await titleTextEle.fill(fileName);

  //获取讲次标题的动态id，用于向上移动一次点击
  const titleClip = integratePromise.locator('iframe').contentFrame().locator('div.content-clip').nth(1);
  const titleParentDiv = titleClip.locator('xpath=..');
  const idTitle = await titleParentDiv.getAttribute('id'); 

  //点击讲次标题向上移动一次（讲次标题移动到最顶部）
  const titleDiv = await integratePromise.locator('iframe').contentFrame().locator('div.slb-lesson-name-con.flex');
  await titleDiv.hover();
  await integratePromise.locator('iframe').contentFrame().locator(`[id="${idTitle}"] svg`).nth(1).click();


  //2、定位样式icon - 添加订正栏信息
  const bookSections = integratePromise.locator('iframe').contentFrame().locator('div.book-col-content > div > div.book-section.section-topic');
  const count = await bookSections.count();
  for (let i = 0; i < count; i++) {
        const currentSection = bookSections.nth(i); 
        await currentSection.click();

        await styleFrame.click();
        await integratePromise.locator('iframe').contentFrame().locator('div').filter({ hasText: /^订正栏\(25年\)添加$/ }).getByRole('button').click();
        await integratePromise.locator('iframe').contentFrame().locator('#root div').filter({ hasText: /^样式库$/ }).locator('svg').click();
        //每添加一个都等3s，不然会出现连续都加在一个题下面
        await integratePromise.waitForTimeout(3000);
    }
  
  await integratePromise.locator('iframe').contentFrame().getByRole('button', { name: '保 存' }).click();
  await integratePromise.locator('iframe').contentFrame().getByRole('button', { name: '发 布' }).click();

  console.log(`融会贯通 ：“ ${fileName}“ 处理完成`);
  await integratePromise.close();
  await page.bringToFront();
  return integratePromise;
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