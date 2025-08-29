import { test as baseTest, type Fixtures, type Page } from '@playwright/test';

type CustomFixtures = {
  loggedInPage: Page; 
};

export const test = baseTest.extend<CustomFixtures>({
  loggedInPage: async ({ page }, use) => {

    await page.goto('https://admin.aixuexi.com/#/home');
    await page.getByRole('textbox', { name: '请输入邮箱账号' }).fill('jt002@qq.com');
    await page.getByRole('textbox', { name: '请输入OA密码' }).fill('123456');
    await page.getByRole('link', { name: '登 录' }).click();
    await page.waitForURL('https://admin.aixuexi.com/#/home');
    
    await use(page);
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