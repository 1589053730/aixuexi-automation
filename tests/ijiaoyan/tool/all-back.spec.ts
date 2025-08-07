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
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// 定义已处理文件记录的存储路径
const processedFileLog = path.resolve(__dirname, 'processed_files.json');

// 初始化处理记录文件
function initProcessedLog() {
  if (!fs.existsSync(processedFileLog)) {
    fs.writeFileSync(processedFileLog, JSON.stringify({}), 'utf-8');
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

// 定义文件类型和对应处理函数的映射
const fileTypeHandlers = {
  '课程资料': handleCourseMaterial,
  '日积月累': handleDailyAccumulation,
  '融会贯通 ': handleIntegration
//   ,
//   '课件': handleCourseware 
};

test('一键替换新样式', async ({ page }) => {
  
  // 初始化处理记录
  initProcessedLog();
  
  test.setTimeout(600000);
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
});

// 递归遍历文件夹逻辑保持不变
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
  await goBackToParentFolder(page);
}

// 按文件类型处理文件的通用方法
async function processFilesByType(page, folderName: string, subFolders: string[], fileType: string, handler: (page, fileName: string) => Promise<void>) {
  console.log(`开始处理文件夹【 ${folderName} 】中的【 ${fileType} 】`);
  
  // 切换文件类型筛选
  await page.getByText('类型').first().waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('.diy-dropdown-trigger > .anticon > svg').first().click();
  await page.getByRole('menuitem', { name: fileType, exact: true }).waitFor({ state: 'visible', timeout: 5000 });
  await page.getByRole('menuitem', { name: fileType, exact: true }).click();
  await page.waitForTimeout(2000);
  
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
  
  console.log(`文件夹【 ${folderName} 】中找到【 ${validFiles.length} 】个${fileType}文件`);
  
  if (validFiles.length === 0) {
    console.log(`文件夹【 ${folderName} 】中没有${fileType}文件`);
    return;
  }
  
  // 调用对应类型的处理函数
  for (const fileName of validFiles) {
    await handler(page, fileName);
  }
}

// 课程资料处理逻辑
async function handleCourseMaterial(page, fileName: string) {
  console.log(`开始处理课程资料：${fileName}`);

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
  
  console.log(`课程资料“${fileName}“处理完成`);
  
  await newPage.close();
  await page.bringToFront();
}

// 日积月累处理逻辑（更换模版、添加标题）
async function handleDailyAccumulation(page, fileName: string) {
  console.log(`开始处理日积月累：${fileName}`);

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
  const styleFrame = newPagePeriodPromise.locator('iframe').contentFrame().locator('div.content-opts > div.o-bar > div > div > div.o-icon').nth(2);
  await styleFrame.click();
  await newPagePeriodPromise.locator('iframe').contentFrame().locator('div').filter({ hasText: /^讲次名称\(25年\)添加$/ }).getByRole('button').click();
  await newPagePeriodPromise.locator('iframe').contentFrame().locator('#root div').filter({ hasText: /^样式库$/ }).locator('use').click();
  await page.waitForTimeout(2000);

  //获取讲次的动态id，用于向上移动一次点击
  const titleStyle = newPagePeriodPromise.locator('iframe').contentFrame().locator('div.content-clip').nth(1);
  const parentTitleStyleDiv = titleStyle.locator('xpath=..');
  const titleId = await parentTitleStyleDiv.getAttribute('id'); 
  console.log('讲次标题动态id:', titleId);

  //此处注释的代码不要删除，另一种获取id的方法还没调完
//   const titleStyle = newPagePeriodPromise.locator('iframe').contentFrame().locator('div.page-content > div.book-section.section-jcmc.page-break-avoid.section-xxsx-lesson-title > div');
//   const titleId = await titleStyle.getAttribute('id');
//   console.log('讲次标题动态id:', titleId);

  //3、替换讲次标题名称为文件名称
  const titleTextEle = newPagePeriodPromise.locator('iframe').contentFrame().locator('div.slb-lesson-name.flex > div > span.flex > div.text-input');
  await titleTextEle.fill(fileName);

  //点击讲次标题向上移动一次（讲次标题移动到最顶部）
  const titleDiv = await newPagePeriodPromise.locator('iframe').contentFrame().locator('div.slb-lesson-name.flex');
  await titleDiv.hover();
  await newPagePeriodPromise.locator('iframe').contentFrame().locator('.slb-lesson-name').click();
  await newPagePeriodPromise.locator('iframe').contentFrame().locator(`[id="${titleId}"] svg`).nth(1).click();

  await newPagePeriodPromise.locator('iframe').contentFrame().getByRole('button', { name: '保 存' }).click();
  await newPagePeriodPromise.locator('iframe').contentFrame().getByRole('button', { name: '发 布' }).click();
  
  console.log(`日积月累“${fileName}“处理完成`);
  await newPagePeriodPromise.close();
  await page.bringToFront();
}

//融汇贯通处理逻辑
async function handleIntegration(page, fileName: string) {
  console.log(`开始处理融会贯通：${fileName}`);

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
  const styleFrame = integratePromise.locator('iframe').contentFrame().locator('div.content-opts > div.o-bar > div > div > div.o-icon').nth(2);
  await styleFrame.click();
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

  //3、定位样式icon - 添加讲次标题
  await styleFrame.click();
  await integratePromise.locator('iframe').contentFrame().locator('div').filter({ hasText: /^讲次名称\+考生信息\(25年\)添加$/ }).getByRole('button').click();
  await integratePromise.locator('iframe').contentFrame().locator('#root div').filter({ hasText: /^样式库$/ }).locator('svg').click();
  await integratePromise.waitForTimeout(3000);

  //3、替换讲次标题名称为文件名称
  const titleTextEle = integratePromise.locator('iframe').contentFrame().locator('div.slb-lesson-name-con.flex > span.flex > div.text-input');
  await titleTextEle.fill(fileName);

  //获取讲次标题的动态id，用于向上移动一次点击
  const titleClip = integratePromise.locator('iframe').contentFrame().locator('div.content-clip').nth(1);
  const titleParentDiv = titleClip.locator('xpath=..');
  const idTitle = await titleParentDiv.getAttribute('id'); 
  console.log(`融会贯通的讲次标题id是：${idTitle}`);

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
        //每添加一个都等2s，不然会出现连续都加在一个题下面
        await integratePromise.waitForTimeout(3000);
    }
  
  await integratePromise.locator('iframe').contentFrame().getByRole('button', { name: '保 存' }).click();
  await integratePromise.locator('iframe').contentFrame().getByRole('button', { name: '发 布' }).click();

  console.log(`融会贯通“${fileName}“处理完成`);
  await integratePromise.close();
  await page.bringToFront();
}

// 新增课件处理逻辑
async function handleCourseware(page, fileName: string) {
  console.log(`开始处理课件：${fileName}`);

  const pagePromise = page.waitForEvent('popup');
  await page.getByText(fileName, { exact: true }).click();
  const newPage = await pagePromise;
  
  // 课件的特殊处理逻辑
  await newPage.waitForURL(/editor/, { waitUntil: 'domcontentloaded' });
  
  // 根据实际需求修改课件的处理步骤
  await newPage.locator('iframe').contentFrame().getByRole('button', { name: '课件刷新' }).click();
  await newPage.locator('iframe').contentFrame().getByRole('button', { name: '确认刷新' }).click();
  
  await newPage.waitForTimeout(8000);
  await newPage.locator('iframe').contentFrame().getByRole('button', { name: '保存课件' }).click();
  
  console.log(`课件“${fileName}“处理完成`);
  
  await newPage.close();
  await page.bringToFront();
}

// 返回上一级文件夹方法保持不变
async function goBackToParentFolder(page) {
  const breadcrumbContainer = page.locator('.ant-breadcrumb');
  await breadcrumbContainer.waitFor({
    timeout: 15000,
    state: 'visible'
  });

  const breadcrumbLinksLocator = breadcrumbContainer.locator(
    '.ant-breadcrumb-link:not(.ant-breadcrumb-link-disabled)'
  );

  const linkCount = await breadcrumbLinksLocator.count();
  if (linkCount < 2) {
    console.warn('没有足够的面包屑层级，无法返回上一级');
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
}