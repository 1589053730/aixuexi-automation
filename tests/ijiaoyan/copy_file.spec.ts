import dns from 'dns';
dns.setDefaultResultOrder('verbatim');

// import { test, expect } from '@playwright/test';
import { test, expect, Page } from '@playwright/test';

test('选择文件夹--复制文件夹--生产完成', async ({ page }) => {
  test.setTimeout(300000);

  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需+1
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
  
  // test.setTimeout(300000 * parseInt(process.env.copyCount || '1', 10)); // 按复制次数调整超时时间

  const subject = process.env.subject;
  const sourceDrive = process.env.sourceDrive;
  const sourcePath = process.env.sourcePath;
  const targetDrive = process.env.targetDrive;
  const targetPath = process.env.targetPath;
  const copyCount = parseInt(process.env.copyCount || '1', 10);
  const courseName = `ui自动化创建-${timestamp}`;
  const courseLessonCount = parseInt(process.env.courseLessonCount || '1', 10);
  const courseDrive = process.env.courseDrive;
  

  // 校验 copyCount 合法性
  // if (isNaN(copyCount) || copyCount < 1) {
  //   throw new Error(`无效的复制次数 copyCount: ${process.env.copyCount}，必须是大于等于1的整数`);
  // }

  // const sourcePath="/san测试/第二讲"
  // const subject = "初中化学";
  // const sourceDrive = "测试专用公共云盘";
  // const targetDrive = "测试专用公共云盘";
  // const targetPath = "/zhangq测试";
  // const copyCount = 2;
  // const courseName = "ui自动化创建022";
  // const courseLessonCount = '2';
  // const courseDrive = "测试专用课程";
  
  
  console.log('=== 环境变量配置 ===');
  console.log('科目:', subject);
  console.log('源目标:', sourceDrive);
  console.log('源文件夹路径:', sourcePath);
  console.log('源路径层级拆分:', sourcePath.split('/'));
  console.log('目标云盘:', targetDrive);
  console.log('目标文件夹路径:', targetPath);
  console.log('目标文件夹层级拆分:', targetPath.split('/'));
  console.log('复制讲次数量:', copyCount);
  console.log(`绑定课程名称: ${courseName}`);
  console.log(`课程讲次数量: ${courseLessonCount}`);
  console.log(`课程讲次数量: ${courseDrive}`);
  console.log('====================');

  // 登录流程（只执行一次）
  await page.goto('https://admin.aixuexi.com/#/home', { waitUntil: 'networkidle', timeout: 60000 });
  console.log('填写用户名和密码');
  await page.getByRole('textbox', { name: '请输入邮箱账号' }).fill('jt002@qq.com');
  await page.getByRole('textbox', { name: '请输入OA密码' }).fill('123456');
  await page.screenshot({ path: 'screenshots/0.png' });
  await page.getByRole('link', { name: '登 录' }).click();
  console.log('登录点击完成');
  
  await page.goto('https://ijiaoyan.aixuexi.com/workbench.html#/', {
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  await page.screenshot({ path: 'screenshots/debug1.png' });
  await page.getByRole('combobox').locator('span').nth(1).click();
  await page.screenshot({ path: 'screenshots/debug2.png' });
  await page.getByRole('option', { name: subject }).click();
  console.log('切换学科完成');
  await page.waitForLoadState('networkidle');

  // 1. 课程库-新建课程
  // await page.goto('http://ijiaoyan.aixuexi.com/workbench.html#/');
  await page.getByText('课程库').click();
  await page.getByText(courseDrive).click();
  await page.getByRole('button', { name: '新建课程' }).click();
  await page.getByRole('textbox', { name: '* 名称' }).click();
  await page.getByRole('textbox', { name: '* 名称' }).fill(courseName);
  await page.locator('.ant-cascader-picker-label').click();
  await page.getByRole('menuitem', { name: '教材版本 图标: right' }).click();
  await page.getByRole('menuitem', { name: '人教版' }).click();
  await page.locator('#schemeId').getByText('请选择').click();
  await page.getByRole('option', { name: '能力强化' }).click();
  await page.locator('#gradeId').getByText('请选择').click();
  await page.getByRole('option', { name: '初一' }).click();
  await page.locator('#period').getByText('请选择').click();
  await page.getByRole('option', { name: '暑假' }).click();
  await page.locator('#years').getByText('请选择').click();
  await page.getByRole('option', { name: '2025' }).click();
  await page.getByRole('spinbutton', { name: '* 讲次' }).click();
  await page.getByRole('spinbutton', { name: '* 讲次' }).fill(courseLessonCount);
  await page.getByRole('button', { name: '确 定' }).click();
  await page.getByRole('button', { name: '返回' }).click();

  // 2. 切换到生产中心开始走复制流程
  await page.waitForSelector('text=生产中心', { timeout: 10000 });
  await page.getByText('生产中心').click();
  await page.getByText(sourceDrive).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots/debug3.png' });

  // 解析源路径层级
  const folderLevels = sourcePath.split('/').filter(level => level.trim() !== '');
  const totalLevels = folderLevels.length;
  console.log('源路径拆分后数量:', totalLevels);

  // 解析目标路径层级
  const targetPathLevels = targetPath.split('/').filter(level => level.trim() !== '');
  const targetTotalLevels = targetPathLevels.length;

  // 根据复制次数循环执行操作
  for (let copyIndex = 0; copyIndex < copyCount; copyIndex++) {
    console.log(`===== 开始第 ${copyIndex + 1}/${copyCount} 次复制操作 =====`);

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需+1
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
    console.log(timestamp);

    // 3. 导航到源文件夹并选中
    // 先回到源驱动器根目录（避免层级残留）
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

    // 4. 执行复制操作
    await page.getByRole('button', { name: '复制到' }).click();
    await page.waitForTimeout(1000);
    await page.getByLabel('复制到').getByText(targetDrive).click();
    await page.waitForTimeout(2000);
    await page.locator('div.folder-tree >> ul >> li >> span >> i >> svg').first().click();
    await page.waitForTimeout(1000);

    // 5. 选择目标文件夹路径
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

    // 6. 确认复制
    await page.getByRole('button', { name: '确 定' }).click();
    console.log(`第 ${copyIndex + 1} 次复制已提交`);
    await page.waitForTimeout(3000); // 等待复制完成

    // 7. 导航到目标文件夹并执行生产完成操作
    await page.locator('div.ant-layout-sider-children > ul > li > div').getByText(targetDrive, { exact: true }).click();
    await page.waitForTimeout(2000);

    for (const [index, folderName] of targetPathLevels.entries()) {
      console.log(`进入目标文件夹层级 ${index + 1}：${folderName}`);
      await page.getByText(folderName, { exact: true }).click();
      await page.waitForTimeout(2000);
    }

    //修改复制后的文件夹名字
    const targetRowOne = page.locator('tbody tr').first();
    const folderNameText = targetRowOne.locator('td:nth-child(3)').textContent();
    // const folderNameUpdate = (await folderNameText).split('-')[0]${timestamp};
    const prefix = (await folderNameText).includes('-') 
      ? (await folderNameText).split('-')[0] 
      : folderNameText; 
    const folderNameUpdate = `${prefix}${timestamp}`;
 

    // const row = page.locator('tbody.ant-table-tbody tr.ant-table-row').nth(i);
    const updateSvg = targetRowOne.locator('td:nth-child(4) >> .list-operation >> span:nth-child(1) >> i >> svg');
    await targetRowOne.hover();
    await updateSvg.click();
    await page.getByRole('textbox', { name: '*' }).fill(folderNameUpdate);
    await page.getByRole('button', { name: '确 定' }).click();

    // await page.locator('tbody').getByRole('menu').getByText('生产完成').click();

    // 进入复制后的文件夹
    await targetRowOne.locator('td:nth-child(3)').click();
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

    
    // 8. 绑定课程配件
    await page.getByText('课程库', { exact: true }).click();
    await page.locator('div.ant-layout-sider-children > ul > li > div').getByText(courseDrive).click();
    await page.getByText(courseName).click();
    //点击左侧导航 ”线下配件-课堂落实“
    await page.locator('div.ant-layout-sider-children > ul > li > ul > li').getByText('课堂落实').click();
    // await page.getByRole('menuitem', { name: '课堂落实' }).click();
    // await page.getByText(courseName).click();

    const liElements = page.locator('li.ant-menu-item.ant-menu-item.auto-height');
    console.log('copyIndex',copyIndex);
    const targetLi = liElements.nth(copyIndex);
    const targetDiv = targetLi.locator('div.card-body.fixed-height');
    await targetDiv.click();

    // await page.locator('div').filter({ hasText: `${folderNameUpdate}` }).click();
    // await page.getByRole('menuitem', { name: '课堂落实' }).nth(1).click();
    await page.locator('div.right > div >div >div.filter-bar ').getByText('课堂落实').click();
    // await page.locator('div').filter({ hasText: /^课堂落实$/ }).click();
    await page.locator('div.right > div >div >div.filter-bar ').getByText('课堂落实').click();
    // await page.getByRole('menuitem', { name: '课堂落实' }).nth(1).click();
    // await page.getByRole('menuitem', { name: '课堂落实' }).nth(1).click();
    for (const [index, folderName] of targetPathLevels.entries()) {
      console.log(`进入目标文件夹层级 ${index + 1}：${folderName}`);
      await page.getByText(folderName, { exact: true }).click();
      // await page.getByRole('menuitem', { name: '课堂落实' }).nth(1).click();
      // await page.waitForTimeout(2000);
    }

    // await page.getByText('zhangq测试').click();
    // await page.getByTitle('第二讲', { exact: true }).locator('span').click();
    // await page.locator('div').filter({ hasText: `${folderNameUpdate}` }).click();
    // await page.locator('div').filter({ hasText: /^课堂落实$/ }).click();
    console.log('folderNameUpdate：',folderNameUpdate);
    await page.getByText(folderNameUpdate, { exact: true }).click();

    // 1. 定义需要切换的所有菜单项（含首次操作的"课堂落实"，统一管理）
    const menuItems = [
      "课堂落实",  // 原代码中首次点击的菜单项，统一纳入数组
      "自我巩固",
      "答案册",
      "笔记本",
      "期中考试",
      "期末考试",
      "精选精炼",
      "课程资料",
      "课堂全解读",
      "教师版作业",
      "教师教材",
      "教师版专属题",
      "教师版进门考"
    ];

    const bindButton = page.getByRole('button', { name: '绑 定' });

    const initialIsVisible = await bindButton.isVisible().catch(() => false);
    if (initialIsVisible) {
      await bindButton.click();
      await page.waitForTimeout(500);
      console.log(`✅ 选中文件夹【${folderNameUpdate}】后，首次检查到绑定按钮，已执行点击`);
    } else {
      console.log(`❌ 选中文件夹【${folderNameUpdate}】后，首次检查未发现绑定按钮，跳过点击`);
    }

    // 循环处理所有菜单项（调用封装函数，消除重复代码）
    for (const menuItem of menuItems) {
      await handleMenuItemBind(page, menuItem, folderNameUpdate);
    }

    // await page.getByText(folderNameUpdate, { exact: true }).click();
    // const isButtonVisible = await bindButton.isVisible().catch(() => false);
    // if (isButtonVisible) {
    //   console.log('存在绑定按钮，执行点击');
    //   await bindButton.click();
    // } else {
    //   console.log('不存在绑定按钮，跳过点击');
    // }
    // await page.getByRole('button', { name: '绑 定' }).click();
    // await page.getByRole('menuitem', { name: '自我巩固' }).click();
    // // await page.getByRole('button', { name: '绑 定' }).click();
    // if (isButtonVisible) {
    //   console.log('存在绑定按钮，执行点击');
    //   await bindButton.click();
    // } else {
    //   console.log('不存在绑定按钮，跳过点击');
    // }
    // await page.getByRole('menuitem', { name: '答案册' }).click();
    // // await page.getByRole('button', { name: '绑 定' }).click();
    // if (isButtonVisible) {
    //   console.log('存在绑定按钮，执行点击');
    //   await bindButton.click();
    // } else {
    //   console.log('不存在绑定按钮，跳过点击');
    // }
    // await page.getByRole('menuitem', { name: '笔记本' }).click();
    // // await page.getByRole('button', { name: '绑 定' }).click();
    // if (isButtonVisible) {
    //   console.log('存在绑定按钮，执行点击');
    //   await bindButton.click();
    // } else {
    //   console.log('不存在绑定按钮，跳过点击');
    // }
    // await page.getByRole('menuitem', { name: '期中考试' }).click();
    // // await page.getByRole('button', { name: '绑 定' }).click();
    // if (isButtonVisible) {
    //   console.log('存在绑定按钮，执行点击');
    //   await bindButton.click();
    // } else {
    //   console.log('不存在绑定按钮，跳过点击');
    // }
    // await page.getByRole('menuitem', { name: '期末考试' }).click();
    // // await page.getByRole('button', { name: '绑 定' }).click();
    // if (isButtonVisible) {
    //   console.log('存在绑定按钮，执行点击');
    //   await bindButton.click();
    // } else {
    //   console.log('不存在绑定按钮，跳过点击');
    // }
    // await page.getByRole('menuitem', { name: '精选精炼' }).click();
    // // await page.getByRole('button', { name: '绑 定' }).click();
    // if (isButtonVisible) {
    //   console.log('存在绑定按钮，执行点击');
    //   await bindButton.click();
    // } else {
    //   console.log('不存在绑定按钮，跳过点击');
    // }
    // await page.getByRole('menuitem', { name: '课程资料' }).click();
    // // await page.getByRole('button', { name: '绑 定' }).click();
    // if (isButtonVisible) {
    //   console.log('存在绑定按钮，执行点击');
    //   await bindButton.click();
    // } else {
    //   console.log('不存在绑定按钮，跳过点击');
    // }
    // // await page.getByRole('row', { name: '60939 讲义 测初中化学样式 创建:jt002' }).getByRole('button').click();
    // await page.getByRole('menuitem', { name: '课堂全解读' }).click();
    // // await page.getByRole('button', { name: '绑 定' }).click();
    // if (isButtonVisible) {
    //   console.log('存在绑定按钮，执行点击');
    //   await bindButton.click();
    // } else {
    //   console.log('不存在绑定按钮，跳过点击');
    // }
    // await page.getByRole('menuitem', { name: '教师版作业' }).click();
    // // await page.getByRole('button', { name: '绑 定' }).click();
    // if (isButtonVisible) {
    //   console.log('存在绑定按钮，执行点击');
    //   await bindButton.click();
    // } else {
    //   console.log('不存在绑定按钮，跳过点击');
    // }
    // await page.getByRole('menuitem', { name: '教师教材' }).click();
    // // await page.getByRole('button', { name: '绑 定' }).click();
    // if (isButtonVisible) {
    //   console.log('存在绑定按钮，执行点击');
    //   await bindButton.click();
    // } else {
    //   console.log('不存在绑定按钮，跳过点击');
    // }
    // await page.getByRole('menuitem', { name: '教师版专属题' }).click();
    // // await page.getByRole('button', { name: '绑 定' }).click();
    // if (isButtonVisible) {
    //   console.log('存在绑定按钮，执行点击');
    //   await bindButton.click();
    // } else {
    //   console.log('不存在绑定按钮，跳过点击');
    // }
    // await page.getByRole('menuitem', { name: '教师版进门考' }).click();
    // // await page.getByRole('button', { name: '绑 定' }).click();
    // if (isButtonVisible) {
    //   console.log('存在绑定按钮，执行点击');
    //   await bindButton.click();
    // } else {
    //   console.log('不存在绑定按钮，跳过点击');
    // }
    await page.getByRole('button', { name: '保存预览' }).click();
    await page.getByRole('button', { name: '返回' }).click();
    await page.getByText('生产中心').click();
  }

  

  console.log('全部复制和生产完成操作已执行完毕');
  await page.evaluate(() => {
    alert('全部操作执行完成');
  });
});

// 2. 封装重复逻辑：切换菜单 + 判断绑定按钮 + 执行点击（复用性更强）
async function handleMenuItemBind(page: Page, menuItem: string, folderNameUpdate: string) {
  // 函数内容保持不变
  const bindButton = page.getByRole('button', { name: '绑 定' }).first();

  try {
    await page.getByRole('menuitem', { name: menuItem, exact: true }).click();
    await page.waitForTimeout(500);
    console.log(`已切换到菜单项：【${menuItem}】`);

    const isButtonVisible = await bindButton.isVisible().catch(() => false);

    if (isButtonVisible) {
      await bindButton.click();
      await page.waitForTimeout(500);
      console.log(`✅ 菜单项【${menuItem}】下存在绑定按钮，已执行点击`);
    } else {
      console.log(`❌ 菜单项【${menuItem}】下不存在绑定按钮，跳过点击`);
    }
  } catch (error) {
    console.error(`处理菜单项【${menuItem}】时出错：`, error);
  }
}