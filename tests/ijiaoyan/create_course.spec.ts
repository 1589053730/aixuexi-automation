// import { test, expect } from '../../fixtures/loginf.fixture';
import dns from 'dns';
dns.setDefaultResultOrder('verbatim');
// import { test, expect } from '@playwright/test';
import { test, Page } from '@playwright/test';

test('课程库-创建课程（人教版-能力强化-暑假-2025）', async ({ page }) => {
  test.setTimeout(600000);

  const timestamp = getTimestamp();
  const courseLessonCount = parseInt(process.env.courseLessonCount || '1', 10);
  const courseName = `ui自动化创建-${timestamp}`;
  const courseDrive = process.env.courseDrive;
  const subject = process.env.subject;

  // 调试
  // const courseName = "ui自动化创建06";
  // const courseLessonCount = '2';
  // const courseDrive = "测试专用课程";
  // const subject = "初中数学";

  console.log('课程名称:', courseName);
  console.log('课程讲次数量:', courseLessonCount);
  console.log('课程库课程位置: ',courseDrive);

  // 登录流程
  await page.goto('https://admin.aixuexi.com/#/home', { waitUntil: 'networkidle', timeout: 60000 });
  console.log('填写用户名和密码');
  await page.getByRole('textbox', { name: '请输入邮箱账号' }).fill('jt002@qq.com');
  await page.getByRole('textbox', { name: '请输入OA密码' }).fill('123456');
  await page.getByRole('link', { name: '登 录' }).click();
  console.log('登录点击完成');

  await page.waitForTimeout(3000);
  
  await page.goto('https://ijiaoyan.aixuexi.com/workbench.html#/', {
    waitUntil: 'domcontentloaded',
    timeout: 50000 
  });

  await page.getByRole('combobox').locator('span').nth(1).click();
  await page.screenshot({ path: 'screenshots/debug2.png' });
  await page.getByRole('option', { name: subject }).click();
  console.log('切换学科完成，开始等待网络空闲状态');
  try {
    // await page.waitForLoadState('networkidle');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    console.log('网络已进入空闲状态，准备点击课程库');
    console.log('尝试点击课程库');

    await page.getByText('课程库').click();
    console.log('课程库点击成功');
    console.log(`尝试点击课程库位置: ${courseDrive}`);
    await page.getByText(courseDrive).click();
  } catch (error) {
    // 捕获错误时生成截图并详细输出错误信息
    const errorTime = new Date().toISOString().replace(/:/g, '-');
    await page.screenshot({ path: `screenshots/error-${errorTime}.png` });
    console.error(`操作失败: ${(error as Error).message}`);
    console.error(`错误发生位置: 切换学科后`);
    console.error(`当前页面URL: ${page.url()}`);
    throw error; 
  }
  await page.getByRole('button', { name: '新建课程' }).click();
  await page.getByRole('textbox', { name: '* 名称' }).click();
  await page.getByRole('textbox', { name: '* 名称' }).fill(courseName);
  await page.locator('.ant-cascader-picker-label').click();
  await page.getByRole('menuitem', { name: '教材版本 图标: right' }).click();
  await page.getByRole('menuitem', { name: '人教版' , exact: true}).click();

  const chose = "请选择..."
  await selectDropdownFirstOption(page, '#schemeId',chose);
  await selectDropdownFirstOption(page, '#gradeId',chose);
  await selectDropdownFirstOption(page, '#period',chose);

  await page.locator('#years').getByText('请选择').click();
  await page.getByRole('option', { name: '2025' }).click();
  await page.getByRole('spinbutton', { name: '* 讲次' }).click();
  await page.getByRole('spinbutton', { name: '* 讲次' }).fill(courseLessonCount.toString());
  await page.getByRole('button', { name: '确 定' }).click();

});

function getTimestamp(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需+1
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

async function selectDropdownFirstOption(page: Page, selector: string,chose:string) {
  // 点击下拉框触发展开
  await page.locator(selector).getByText(`${chose}`).click();
  
  // 等待下拉框元素加载并获取aria-controls属性
  const targetDiv = page.locator(`${selector} > div[aria-controls]`);
  await targetDiv.waitFor({ state: 'visible' });
  const ariaControlsValue = await targetDiv.getAttribute('aria-controls');
  
  if (!ariaControlsValue) {
    throw new Error(`下拉框${selector}未找到aria-controls属性`);
  }
  
  // 定位下拉选项并选择第一个
  const dropdown = page.locator(`[id="${ariaControlsValue}"]`);
  await dropdown.waitFor({ state: 'visible', timeout: 20000 });
  const firstOption = dropdown.locator('ul > li').first();
  await firstOption.waitFor({ state: 'visible', timeout: 10000 });
  await firstOption.click();
}