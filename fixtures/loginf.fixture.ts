import { test as baseTest, type Fixtures, type Page } from '@playwright/test';

// 1. 定义自定义 Fixture 类型（使用导入的 Page 类型）
type CustomFixtures = {
  loggedInPage: Page; // 此时 Page 已被正确识别，无红线
};

// 2. 扩展基础 test，指定自定义 Fixtures 类型
export const test = baseTest.extend<CustomFixtures>({
  loggedInPage: async ({ page }, use) => {
    // 登录逻辑（page 类型为 Page，操作正常）
    await page.goto('https://admin.aixuexi.com/#/home');
    await page.getByRole('textbox', { name: '请输入邮箱账号' }).fill('jt002@qq.com');
    await page.getByRole('textbox', { name: '请输入OA密码' }).fill('123456');
    await page.getByRole('link', { name: '登 录' }).click();
    await page.waitForURL('https://admin.aixuexi.com/#/home');
    
    await use(page); // 传递登录后的 page 给测试用例
  },
});

export const expect = test.expect;






// --------------------------------------------------------------
// import { test as base } from '@playwright/test';
// import { Page } from '@playwright/test';

// type TestFixtures = {
//   loggedInPage: Page;
// };

// // 扩展后的 test 对象
// export const test = baseTest.extend<TestFixtures>({
//   loggedInPage: async ({ page }, use) => {
//     // 登录逻辑不变
//     await page.goto('https://admin.aixuexi.com/#/home');
//     await page.getByRole('textbox', { name: '请输入邮箱账号' }).fill('jt002@qq.com');
//     await page.getByRole('textbox', { name: '请输入OA密码' }).fill('123456');
//     await page.getByRole('link', { name: '登 录' }).click();
//     await page.waitForURL('https://admin.aixuexi.com/#/home');
//     await use(page);
//   },
// });

// export const expect = test.expect;