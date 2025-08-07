import { test, expect } from '@playwright/test';

test('一键替换新样式', async ({ page }) => {
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

// 递归函数，用于遍历文件夹
async function traverseFolders(page, folderName: string) {
  console.log(`进入文件夹: ${folderName}`);
  
  await page.getByText(folderName).click();
  await page.waitForTimeout(4000);
  
  await page.waitForFunction(
    () => {
      const tbody = document.querySelector('tbody.ant-table-tbody');
      return !!tbody; // 只要tbody元素存在就返回true
    },
    {},
    { timeout: 5000 }
  );

  
  // 获取所有行
  const rows = await page.$$('tbody.ant-table-tbody tr.ant-table-row');
  
  if (rows.length === 0) {
    console.log(`文件夹【 ${folderName} 】中没有讲义，返回上一级`);
    await page.waitForTimeout(3000);
    await goBackToParentFolder(page);
    return;
  }
  
  // 先收集所有子文件夹（用于后续排除）
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
  
  // 递归处理所有子文件夹
  for (const subFolder of subFolders) {
    await traverseFolders(page, subFolder);
  }
  
  // 处理当前文件夹中的文件（排除已处理的子文件夹）
  await processFilesInCurrentFolder(page, folderName, subFolders);
  
  console.log(`文件夹【 ${folderName} 】处理完成，返回上一级`);
  await goBackToParentFolder(page);
}

// 处理当前文件夹中的文件
async function processFilesInCurrentFolder(page, folderName: string, subFolders: string[]) {
  console.log(`开始处理文件夹【 ${folderName} 】中的文件`);
  
  await page.getByText('类型').first().waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('.diy-dropdown-trigger > .anticon > svg').first().click();
  // await page.getByText('类型').first().click();
  // await page.getByRole('menuitem', { name: '课程资料', exact: true }).click();
  
  await page.getByRole('menuitem', { name: '课程资料', exact: true }).waitFor({ state: 'visible', timeout: 5000 });
  await page.getByRole('menuitem', { name: '课程资料', exact: true }).click();
  await page.waitForTimeout(1000);
  
  // 重新获取筛选后的行（避免缓存旧数据）
  const fileRows = await page.$$('tbody.ant-table-tbody tr.ant-table-row');
  const validFiles: string[] = [];
  
  // 遍历行，排除子文件夹，只保留真正的文件
  for (const row of fileRows) {
    const thirdColumn = await row.$('td:nth-child(3)');
    if (!thirdColumn) continue;
    
    const nameElement = await thirdColumn.$('div > div > div > span');
    if (!nameElement) continue;
    
    const fileName = await nameElement.textContent() ?? '';
    const trimmedFileName = fileName.trim();
    
    // 核心判断：如果讲义名不在子文件夹列表中，才视为有效文件
    if (trimmedFileName && !subFolders.includes(trimmedFileName)) {
      validFiles.push(trimmedFileName);
    }
  }
  
  console.log(`文件夹【 ${folderName} 】中找到【 ${validFiles.length} 】个讲义文件`);
  
  if (validFiles.length === 0) {
    console.log(`文件夹【 ${folderName} 】中没有讲义文件`);
    return;
  }
  
  // 处理每个讲义文件
  for (const fileName of validFiles) {
    console.log(`开始进入讲义：${fileName}`);

    const pagePromise = page.waitForEvent('popup');
    await page.getByText(fileName, { exact: true }).click();
    const newPage = await pagePromise;
    
    // 刷新样式操作
    const updatedUrl = `${newPage.url()}&batchReplace=1`; 
    await newPage.goto(updatedUrl, { waitUntil: 'domcontentloaded' });
    await newPage.reload({ waitUntil: 'domcontentloaded' });
    
    await newPage.locator('iframe').contentFrame().getByRole('button', { name: '刷样式' }).click();
    await newPage.locator('iframe').contentFrame().getByRole('button', { name: '确 认' }).click();
    
    // 等待10s不动页面，操作完成并保存
    await newPage.waitForTimeout(10000);
    await newPage.locator('iframe').contentFrame().getByRole('button', { name: '保 存' }).click();
    
    console.log(`讲义”${fileName} “ 刷新样式操作完成`);
    
    await newPage.close();
    await page.bringToFront();
    // await page.waitForTimeout(1000);
  }
}

// 返回上一级文件夹的通用方法
async function goBackToParentFolder(page) {
  // const breadcrumbLinks = await page.$$('.ant-breadcrumb .ant-breadcrumb-link');
  const breadcrumbContainer = page.locator('.ant-breadcrumb');
    await breadcrumbContainer.waitFor({
      timeout: 15000,
      state: 'visible'
    });

    // 2. 获取所有可用面包屑链接的定位器
    const breadcrumbLinksLocator = breadcrumbContainer.locator(
      '.ant-breadcrumb-link:not(.ant-breadcrumb-link-disabled)'
    );

    // 3. 检查链接数量
    const linkCount = await breadcrumbLinksLocator.count();
    if (linkCount < 2) {
      console.warn('没有足够的面包屑层级，无法返回上一级');
      return;
    }

    // 4. 获取父级目录的定位器
    const parentLinkLocator = breadcrumbLinksLocator.nth(linkCount - 2);

    // 5. 等待父级链接可见
    await parentLinkLocator.waitFor({
      timeout: 5000,
      state: 'visible'
    });

    // 6. 执行点击并等待导航完成（修复waitUntil参数）
    await Promise.all([
      page.waitForNavigation({
        timeout: 20000,
        // 只使用单个值而不是数组，兼容所有版本
        waitUntil: 'networkidle'
      }),
      parentLinkLocator.click({
        timeout: 5000,
        delay: 100,
        button: 'left'
      })
    ]);
}