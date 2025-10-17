import dns from 'dns';
dns.setDefaultResultOrder('verbatim');
import { test, Page , expect} from '@playwright/test';

test('创建试卷-添加题目（知识图谱试题-按点模图谱）-保存发布-生产完成', async ({page }) => {

  test.setTimeout(1500000);
  const timestamp = getTimestamp();

  const subject = process.env.subject;
  const questionCount = process.env.questionCount ? parseInt(process.env.questionCount, 10) : 0;
  const examName = `ui自动化创建-${timestamp}`;

  const questionTypesConfig = process.env.questionTypes ? JSON.parse(process.env.questionTypes) : {};
  const questionTypes = questionTypesConfig.flatMap(item => {
    if (item.exam && Array.isArray(item.exam)) {
      return item.exam;
    }
    return [];
  });  
  console.log('questionTypes:', questionTypes);

  // 调试用
  // const subject = "初中数学";
  // const questionTypes = [ 'fill', 'judge', 'answer' ];
  // const processedQuestionTypes = process.env.processedQuestionTypes;
  // const questionCount = 5;
  // const examName = "ui自动化创建01";

  
  console.log('=== 环境变量配置 ===');
  console.log('科目:', subject);
  console.log('需要添加的题目类型:', questionTypes);
  console.log('每种题目数量:', questionCount);
  console.log('试卷名称:', examName);  
  console.log('====================');

  // 登录流程
  await page.goto('https://admin.aixuexi.com/#/home', { waitUntil: 'networkidle', timeout: 60000 });
  console.log('填写用户名和密码');
  await page.getByRole('textbox', { name: '请输入邮箱账号' }).fill('jt002@qq.com');
  await page.getByRole('textbox', { name: '请输入OA密码' }).fill('123456');
  await page.getByRole('link', { name: '登 录' }).click();
  console.log('登录点击完成');
  await page.waitForTimeout(3000);
  
  await page.goto('https://ijiaoyan.aixuexi.com/workbench.html#/', {
    waitUntil: 'networkidle',
    timeout: 50000 
  });

  await page.getByRole('combobox').locator('span').nth(1).click();
  await page.screenshot({ path: 'screenshots/debug2.png' });
  await page.getByRole('option', { name: subject }).click();
  console.log('切换学科完成');
  await page.waitForLoadState('networkidle');

  // 1. 创建试卷
  await page.goto('https://ijiaoyan.aixuexi.com/workbench.html#/');
  // await page.waitForLoadState('networkidle');
  await page.getByText('生产中心').click();
  await page.getByText('测试专用公共云盘').click();
  await page.getByText('ui自动化测试文件夹').click();
  await page.getByRole('button', { name: '新建' }).click();
  await page.getByText('试卷', { exact: true }).click();
  await page.getByRole('textbox', { name: '* 名称:' }).click();
  await page.getByRole('textbox', { name: '* 名称:' }).fill(examName);
  await page.locator('.ant-cascader-picker-label').click();
  await page.getByRole('menuitem', { name: '教材版本 图标: right' }).click();
  await page.getByRole('menuitem', { name: '人教版'  , exact: true}).click();
  
  await selectDropdownFirstOption(page, '#GRADE');
  await selectDropdownFirstOption(page, '#TERM');
  await selectDropdownFirstOption(page, '#SCHEME');
  await selectDropdownFirstOption(page, '#bizType');

  await page.getByRole('button', { name: '下一步,选择模版' }).click();
  await page.locator('.img-box').first().click();
  const page1Promise = page.waitForEvent('popup');
  await page.getByRole('button', { name: '完 成' }).click();

  const page1 = await page1Promise;
  await page1.waitForLoadState('domcontentloaded');

  const questionTypeMap = {
    choice: '选择题',
    fill: '填空题',
    judge: '判断题',
    answer: '解答题',
    comprehensive: '综合题'
  };

  // 获取所有需要勾选的题目类型文本
  const typesToSelect = questionTypes
    .filter(type => Object.keys(questionTypeMap).includes(type))
    .map(type => questionTypeMap[type as keyof typeof questionTypeMap]);

  console.log('准备添加试题');  
  // 如果有需要勾选的类型，则依次点击勾选
  if (typesToSelect.length > 0) {
    
    for (const typeText of typesToSelect) {
      const mainFrame = page1.frameLocator('iframe').first();
      
      // 2. 打开资源库并筛选题目类型
      //点击资源库图标
      await mainFrame.locator('xpath=//*[@id="root"]/div/div[2]/div[2]/div/div[2]/div[4]/div/div/i').click();
      await page1.waitForTimeout(4000);
      const resourceContentFrame = page1.locator('iframe').contentFrame().locator('iframe.topic-iframe').contentFrame();
      
      // 点击勾选对应的题目类型筛选
      const filterGroup = resourceContentFrame.locator('ul.tile-options'); 
      await filterGroup.getByText(typeText, { exact: true }).click();
      await page1.waitForTimeout(5000);

      console.log('开始循环添加指定数量题目');  
      // 3. 循环添加指定数量的题目
      for (let i = 1; i <= questionCount; i++) {
        await page.screenshot({ path: 'screenshots/准备添加试题.png' });
        console.log(`添加第${i}道${typeText}`);
        await page1.locator('iframe').contentFrame().getByRole('tabpanel').locator('iframe').contentFrame().locator(`div:nth-child(${i}) > .action-toolbar > .bottom-right > .user-tool > .add-btn`).click();
        //此处点击第一道题目等待5s，是因为页面有bug，连续快速点击两次"添加题目"页面会出现白屏，导致后面操作元素无法找到，刷新页面可跳过这个bug
        await page1.waitForTimeout(5000);
      }

      await page.screenshot({ path: 'screenshots/关闭资源库.png' });
      console.log('关闭资源库'); 
      // 关闭资源库
      await page1.locator('iframe').contentFrame().locator('#root div').filter({ hasText: /^资源库$/ }).locator('use').click();
      await page1.waitForTimeout(5000);
    }
  }

  console.log('开始设置分值'); 
  // 4. 分值设置、保存发布
  await page1.frameLocator('iframe').first().locator('xpath=//*[@id="root"]/div/div[2]/div[2]/div/div[2]/div[2]/div/div/i').click();
  await page1.locator('iframe').contentFrame().getByRole('button', { name: '自动分配分数' }).click();
  await page1.locator('iframe').contentFrame().getByRole('button', { name: '保 存' }).click();
  await page1.locator('iframe').contentFrame().getByRole('button', { name: '发 布' }).click();
  await page1.close();

  // 5. 切换回原页面，点击生产完成
  await page.bringToFront();
  const target_row = page.locator(
            `tbody tr:has-text("${examName}")`  
        ).first();
  target_row.hover();
  const icon_more = target_row.locator(
            'td:nth-child(4) >> .list-operation >> span:nth-child(3) >> i >> svg'
        );
  await icon_more.click();
  await page.locator('tbody').getByRole('menu').getByText('生产完成').click();
  await page.getByRole('button', { name: '生产完成' }).click();
  const status_elem = target_row.locator(
            'td:nth-child(11)'
        );
  await expect(status_elem).toHaveText('已完成');
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

async function selectDropdownFirstOption(page: Page, selector: string) {
  // 点击下拉框触发展开
  await page.locator(selector).getByText('请选择选项').click();
  
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
