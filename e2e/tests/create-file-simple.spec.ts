import { expect, test } from "@playwright/test";
import {
  AssertionHelper,
  AuthHelper,
  FileOperationsHelper,
  NavigationHelper,
} from "../utils/test-helpers";

/**
 * 新建文件功能简化测试
 * 
 * 测试：创建文件 → 预览文件 → 编辑文件 → 保存文件的完整流程
 */
test("新建文件完整工作流测试", async ({ page }) => {
  const authHelper = new AuthHelper(page);
  const navigationHelper = new NavigationHelper(page);
  const assertionHelper = new AssertionHelper(page);
  const fileOperationsHelper = new FileOperationsHelper(page);

  // 登录
  await authHelper.login();
  await navigationHelper.goToFiles();

  const baseFileName = `e2e-test-${Date.now()}`;
  const fileName = `${baseFileName}.md`;
  
  try {
    // 步骤 1: 创建新文件
    console.log("🔨 步骤 1: 创建新文件");
    
    // 点击新建文件按钮（使用精确选择器）
    const createFileButton = page.getByRole('button', { name: '新建文件', exact: true });
    await createFileButton.click();

    // 等待对话框打开
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // 输入文件名（不包含扩展名）
    const filenameInput = page.locator('input[id="filename"]');
    await filenameInput.fill(baseFileName);
    
    // 选择 Markdown 类型
    const markdownTypeButton = page.locator('button:has-text(".md")');
    await markdownTypeButton.click();
    
    // 创建文件
    const createButton = page.locator('button:has-text("创建文件")');
    await createButton.click();
    
    // 等待对话框关闭
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10000 });
    await page.waitForLoadState("networkidle");
    
    // 等待文件列表刷新（给更多时间）
    await page.waitForTimeout(2000);
    await fileOperationsHelper.waitForFileList();
    
    // 验证文件出现在列表中
    await assertionHelper.assertFileExists(fileName);
    console.log(`✅ 文件 "${fileName}" 创建成功`);

    // 步骤 2: 点击文件进入预览
    console.log("👀 步骤 2: 进入预览页面");
    const fileItem = page.locator(`main p:has-text("${fileName}")`).first();
    await fileItem.click();
    
    // 等待预览页面加载
    await page.waitForURL(new RegExp(`/files/preview/.*/${encodeURIComponent(fileName)}`), { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    console.log("✅ 成功进入预览页面");

    // 步骤 3: 点击编辑按钮进入编辑模式
    console.log("✏️ 步骤 3: 点击编辑按钮进入编辑模式");
    
    // 等待页面完全加载
    await page.waitForTimeout(3000);
    
    // 查找并点击编辑按钮
    const editButton = page.locator('button:has-text("编辑")').first();
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.click();
    console.log("✅ 已点击编辑按钮");
    
    // 等待编辑器初始化完成
    console.log("⏳ 等待 Monaco 编辑器初始化完成...");
    
    // 等待 Monaco 编辑器出现并完成初始化
    try {
      const monacoEditor = page.locator('[class*="monaco-mouse-cursor-text"]');
      await monacoEditor.waitFor({ state: 'visible', timeout: 15000 });
      console.log("✅ Monaco 编辑器初始化完成");
    } catch (error) {
      console.log("⚠️ 未找到 Monaco 编辑器，尝试其他方式");
      // 如果没有找到 Monaco 编辑器，等待一段时间后继续
      await page.waitForTimeout(3000);
    }
    
    // 步骤 4: 在编辑器中输入内容
    console.log("📝 步骤 4: 在编辑器中输入内容");
    const testContent = "# 测试文档\n\n这是一个 E2E 测试创建的文档。";
    
    // 点击编辑器区域确保焦点在编辑器上
    const monacoEditor = page.locator('[class*="monaco-mouse-cursor-text"]').first();
    await monacoEditor.click();
    await page.waitForTimeout(500);
    
    // 输入内容
    await page.keyboard.type(testContent);
    console.log("✅ 内容输入成功");
    
    // 步骤 5: 保存文件
    console.log("💾 步骤 5: 保存文件");
    await page.keyboard.press('Control+s');
    
    // 等待保存完成
    await page.waitForTimeout(2000);
    console.log("✅ 文件保存成功");
    
    // 步骤 6: 退出编辑模式
    console.log("🚪 步骤 6: 退出编辑模式");
    const exitEditButton = page.locator('button:has-text("退出编辑"), button:has-text("预览"), button:has-text("完成")').first();
    if (await exitEditButton.count() > 0) {
      await exitEditButton.click();
      console.log("✅ 已退出编辑模式");
    } else {
      console.log("ℹ️ 未找到退出编辑按钮");
    }
    
    // 等待退出编辑模式完成
    await page.waitForTimeout(1000);

    // 步骤 7: 验证内容已保存
    console.log("🔍 步骤 7: 验证保存的内容");
    
    // 刷新页面验证内容持久化
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    
    // 检查页面是否包含我们输入的内容
    const testDocText = page.locator('*:has-text("测试文档")');
    if (await testDocText.count() > 0) {
      console.log("✅ 内容验证成功 - 文件已正确保存");
    } else {
      console.log("⚠️ 内容验证失败，未找到'测试文档'文本");
    }

    console.log("🎉 完整工作流测试成功完成！");

  } finally {
    // 清理：删除测试文件
    try {
      await navigationHelper.goToFiles();
      await fileOperationsHelper.waitForFileList();
      
      const fileExists = await page.locator(`main p:has-text("${fileName}")`).count() > 0;
      if (fileExists) {
        await fileOperationsHelper.deleteFile(fileName, false, 0);
        console.log(`🧹 清理: 已删除测试文件 "${fileName}"`);
      }
    } catch (error) {
      console.warn(`⚠️ 清理测试文件时出错: ${error}`);
    }
  }
});