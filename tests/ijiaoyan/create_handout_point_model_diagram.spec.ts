import { test, expect } from '../../fixtures/loginf.fixture';

test('创建讲义-添加题目（知识图谱试题-按点模图谱）-保存发布-生产完成', async ({ loggedInPage: page }) => {

  test.setTimeout(1800000);

  // const questionTypes = [ 'fill', 'judge', 'answer' ];

  // const questionTypes = process.env.questionTypes?.split(',') || [];
  // console.log('需要添加的题目类型:', questionTypes);

  const questionTypesConfig = process.env.questionTypes ? JSON.parse(process.env.questionTypes) : [];
  const questionTypes = questionTypesConfig.flatMap(item => {
    if (item.exam && Array.isArray(item.exam)) {
      return item.exam;
    }
    return [];
  });
  console.log('需要添加的题目类型:', questionTypes);

  const timestamp = new Date().getTime();
  const examName = `ui-test_${timestamp}`;
  console.log(`生成的试卷名称: ${examName}`);

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
  await page.getByRole('menuitem', { name: '人教版' }).click();
  await page.locator('#GRADE').getByText('请选择选项').click();
  await page.getByRole('option', { name: '初一' }).click();
  await page.locator('#TERM').getByText('请选择选项').click();
  await page.getByRole('option', { name: '暑假' }).click();
  await page.locator('#SCHEME').getByText('请选择选项').click();
  await page.getByRole('option', { name: '思维创新' }).click();
  await page.locator('#bizType').getByText('请选择选项').click();
  await page.getByRole('option', { name: '课堂落实' }).click();
  await page.getByRole('button', { name: '下一步,选择模版' }).click();
  await page.locator('.img-box').first().click();
  const page1Promise = page.waitForEvent('popup');
  await page.getByRole('button', { name: '完 成' }).click();

  const page1 = await page1Promise;
  await page1.waitForLoadState('domcontentloaded'); // 优先等待DOM加载完成

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

  // 如果有需要勾选的类型，则依次点击勾选
  if (typesToSelect.length > 0) {
    
    for (const typeText of typesToSelect) {
      const mainFrame = page1.frameLocator('iframe').first();
      
      // 2. 打开资源库并筛选题目类型
      //点击资源库图标，其他方式总是失败，暂时用Xpath，但是不建议
      await mainFrame.locator('xpath=//*[@id="root"]/div/div[2]/div[2]/div/div[2]/div[4]/div/div/i').click();
      await page1.waitForTimeout(4000);
      const resourceContentFrame = page1.locator('iframe').contentFrame().locator('iframe.topic-iframe').contentFrame();
      
      // 点击勾选对应的题目类型筛选
      const filterGroup = resourceContentFrame.locator('ul.tile-options'); 
      // await resourceContentFrame.getByText(typeText, { exact: true }).click();
      await filterGroup.getByText(typeText, { exact: true }).click();
      await page1.waitForTimeout(5000);

      const questionListFrame = mainFrame.frameLocator('iframe').first();
 
      await (typeText === '选择题' 
        ? questionListFrame 
        : page1.locator('iframe').contentFrame().getByRole('tabpanel').locator('iframe').contentFrame()
      ).locator('.add-btn').first().click();
      
      //此处点击第一道题目等待3s，是因为页面有bug，连续快速点击两次"添加题目"页面会出现白屏，导致后面操作元素无法找到，刷新页面可跳过这个bug
      await page1.waitForTimeout(5000);
      await page1.locator('iframe').contentFrame().getByRole('tabpanel').locator('iframe').contentFrame().locator('div:nth-child(2) > .action-toolbar > .bottom-right > .user-tool > .add-btn').click();
      await page1.waitForTimeout(5000);
      await page1.locator('iframe').contentFrame().getByRole('tabpanel').locator('iframe').contentFrame().locator('div:nth-child(3) > .action-toolbar > .bottom-right > .user-tool > .add-btn').click();
      await page1.waitForTimeout(5000);
      await page1.locator('iframe').contentFrame().locator('#root div').filter({ hasText: /^资源库$/ }).locator('use').click();
      await page1.waitForTimeout(5000);
    }
  }

  // 4. 分值设置、保存发布等
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
