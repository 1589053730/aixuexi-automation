import { test, expect } from '../../fixtures/loginf.fixture';

test('登录成功后跳转首页', async ({ page }) => {
  test.setTimeout(90000);
  // 登录逻辑
  await page.goto('https://admin.aixuexi.com/#/home');
  await page.getByRole('textbox', { name: '请输入邮箱账号' }).fill('jt002@qq.com');
  await page.getByRole('textbox', { name: '请输入OA密码' }).fill('123456');
  await page.getByRole('link', { name: '登 录' }).click();
  await page.waitForURL('https://admin.aixuexi.com/#/home');
});

// test('错误密码登录失败', async ({ page }) => {
//   await page.goto('https://admin.aixuexi.com/#/home');
//   await page.getByRole('textbox', { name: '请输入邮箱账号' }).fill('jt002@qq.com');
//   await page.getByRole('textbox', { name: '请输入OA密码' }).fill('111111');
//   await page.getByRole('link', { name: '登 录' }).click();
//   // 验证错误提示
//   await expect(page.getByText('用户名/密码错误，请确认账号是否开通')).toBeVisible();
// });
