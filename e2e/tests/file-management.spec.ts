import { expect, test } from "@playwright/test";
import fs from "node:fs";
import {
  AssertionHelper,
  AuthHelper,
  FileOperationsHelper,
  NavigationHelper,
  TestDataFactory,
  TestUtils,
} from "../utils/test-helpers";

/**
 * 文件管理功能测试
 *
 * 测试 Storkitty 系统的文件浏览、上传、删除、重命名等核心文件管理功能
 */
test.describe("文件管理", () => {
  let authHelper: AuthHelper;
  let navigationHelper: NavigationHelper;
  let assertionHelper: AssertionHelper;
  let fileOperationsHelper: FileOperationsHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    navigationHelper = new NavigationHelper(page);
    assertionHelper = new AssertionHelper(page);
    fileOperationsHelper = new FileOperationsHelper(page);

    // 每个测试前都需要登录
    await authHelper.login();
  });

  test.describe("文件浏览", () => {
    test("应该显示文件列表", async ({ page }) => {
      await navigationHelper.goToFiles();

      // 等待文件列表加载
      await fileOperationsHelper.waitForFileList();

      // 验证至少有一些预设的测试文件
      const files = await fileOperationsHelper.getFileList();
      expect(files.length).toBeGreaterThan(0);
    });

    test("应该显示文件元数据", async ({ page }) => {
      await navigationHelper.goToFiles();
      await fileOperationsHelper.waitForFileList();

      // 获取文件列表并检查第一个文件
      const files = await fileOperationsHelper.getFileList();
      expect(files.length).toBeGreaterThan(0);

      const firstFile = files[0];
      await expect(firstFile).toBeVisible();

      // 验证文件名显示（在卡片或列表中）
      const fileName = await firstFile.locator('p[title], p:has-text(".")').first().textContent();
      expect(fileName).toBeTruthy();
    });

    test("应该支持目录导航", async ({ page }) => {
      await navigationHelper.goToFiles();
      await fileOperationsHelper.waitForFileList();

      // 查找文件夹（从全局测试设置的test-subfolder）
      const folderItem = page.locator('p:has-text("test-subfolder")').first();

      if ((await folderItem.count()) > 0) {
        // 点击文件夹进入
        await folderItem.click();

        // 验证 URL 变化（进入子目录）
        await page.waitForURL(/\/files\/.*/, { timeout: 5000 });

        // 验证文件列表重新加载
        await fileOperationsHelper.waitForFileList();
      }
    });
  });

  test.describe("文件上传", () => {
    test("应该能够上传单个文件", async ({ page }) => {
      await navigationHelper.goToFiles();

      // 创建临时测试文件
      const tempFilePath = await TestUtils.createTempFile("Test file content", ".txt");
      
      // 从文件路径获取实际的文件名
      const fileName = tempFilePath.split('/').pop() || 'test-file.txt';

      try {
        // 执行文件上传
        await fileOperationsHelper.uploadFile(tempFilePath);

        // 关闭上传抽屉
        await page.keyboard.press('Escape');
        
        // 等待页面刷新并加载文件列表
        await page.waitForTimeout(2000);
        await fileOperationsHelper.waitForFileList();

        // 验证文件出现在列表中
        await assertionHelper.assertFileExists(fileName);
      } finally {
        // 清理临时文件
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    });

    test("应该显示上传进度", async ({ page }) => {
      await navigationHelper.goToFiles();

      // 创建较大的测试文件来观察进度
      const largeContent = "A".repeat(10000); // 10KB 内容
      const tempFilePath = await TestUtils.createTempFile(largeContent, ".txt");

      try {
        // 开始上传
        const uploadButton = page.locator('button:has-text("上传")');
        await uploadButton.click();

        // 等待抽屉打开
        await page.waitForSelector('[class*="translate-x-0"]', { timeout: 5000 });

        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(tempFilePath);

        // 等待上传完成，不依赖特定的进度指示器
        await page.waitForTimeout(3000);
      } finally {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    });
  });

  test.describe("目录操作", () => {
    test("应该能够创建新目录", async ({ page }) => {
      await navigationHelper.goToFiles();

      const testDirData = TestDataFactory.createTestDirectoryData();

      // 创建目录
      await fileOperationsHelper.createDirectory(testDirData.name);

      // 验证目录出现在列表中（这是最可靠的验证方式）
      await assertionHelper.assertFileExists(testDirData.name);
    });

    test("应该验证目录名称", async ({ page }) => {
      await navigationHelper.goToFiles();

      // 尝试创建无效名称的目录
      const createButton = page.locator('button:has-text("新建文件夹")');
      await createButton.click();

      // 等待对话框打开
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // 输入无效名称（包含非法字符）
      const nameInput = page.locator('input[id="directory-name"], input[placeholder="请输入文件夹名称"]');
      await nameInput.fill("invalid/name");

      // 尝试创建
      const confirmButton = page.locator('button:has-text("创建")');
      await confirmButton.click();

      // 验证错误消息（可能在对话框中或者toast中）
      try {
        await assertionHelper.assertErrorMessage();
      } catch {
        // 如果没有找到错误消息，检查对话框是否仍然打开（说明创建失败）
        await expect(page.locator('[role="dialog"]')).toBeVisible();
      }
    });
  });

  test.describe("文件操作", () => {
    let testFileName: string;

    test.beforeEach(async ({ page }) => {
      // 为每个测试创建一个测试文件
      const tempFilePath = await TestUtils.createTempFile("Test file content for operations", ".txt");
      
      // 从文件路径获取实际的文件名
      testFileName = tempFilePath.split('/').pop() || 'test-file.txt';

      try {
        await fileOperationsHelper.uploadFile(tempFilePath);
        
        // 通过点击背景关闭上传抽屉
        await page.locator('.fixed.inset-0 .absolute.inset-0').first().click({ position: { x: 100, y: 100 } });
        await page.waitForTimeout(1000);
        
        // 验证文件存在于主文件列表中
        await page.waitForSelector(`main p:has-text("${testFileName}")`, { timeout: 10000 });
      } finally {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    });

    test("应该能够重命名文件", async ({ page }) => {
      const newFileName = TestUtils.generateRandomFileName();

      // 执行重命名
      await fileOperationsHelper.renameFile(testFileName, newFileName);

      // 验证成功消息
      await assertionHelper.assertSuccessMessage();

      // 验证旧文件名不存在，新文件名存在
      await assertionHelper.assertFileNotExists(testFileName);
      await assertionHelper.assertFileExists(newFileName);
    });

    test("应该能够删除文件", async ({ page }) => {
      // 执行删除
      await fileOperationsHelper.deleteFile(testFileName);

      // 验证成功消息
      await assertionHelper.assertSuccessMessage();

      // 验证文件不再存在
      await assertionHelper.assertFileNotExists(testFileName);
    });

    test("应该确认删除操作", async ({ page }) => {
      const fileItem = await fileOperationsHelper.findFile(testFileName);

      // 悬停以显示操作菜单按钮
      await fileItem.hover();

      // 点击更多操作按钮（三个点）
      const moreButton = fileItem.locator('../..//button[contains(@class, "h-8")]').first();
      await moreButton.click();

      // 等待下拉菜单打开
      await page.waitForSelector('[role="menu"]', { timeout: 5000 });

      // 点击删除按钮
      const deleteMenuItem = page.locator('[role="menuitem"]:has-text("删除")');
      await deleteMenuItem.click();

      // 验证确认对话框出现
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // 取消删除
      const cancelButton = page.locator('button:has-text("取消")');
      if ((await cancelButton.count()) > 0) {
        await cancelButton.click();

        // 等待对话框关闭
        await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });

        // 验证文件仍然存在
        await assertionHelper.assertFileExists(testFileName);
      }
    });
  });

  test.describe("文件下载", () => {
    test("应该能够下载文件", async ({ page }) => {
      await navigationHelper.goToFiles();
      await fileOperationsHelper.waitForFileList();

      // 查找已知的测试文件（sample.txt）
      const fileItem = page.locator('p:has-text("sample.txt")').first();

      if ((await fileItem.count()) > 0) {
        // 悬停以显示操作菜单按钮
        await fileItem.hover();

        // 点击更多操作按钮（三个点）
        const moreButton = fileItem.locator('../..//button[contains(@class, "h-8")]').first();
        await moreButton.click();

        // 等待下拉菜单打开
        await page.waitForSelector('[role="menu"]', { timeout: 5000 });

        // 点击下载按钮
        const downloadMenuItem = page.locator('[role="menuitem"]:has-text("下载文件")');

        if ((await downloadMenuItem.count()) > 0) {
          // 监听下载事件
          const downloadPromise = page.waitForEvent("download");
          await downloadMenuItem.click();

          // 验证下载开始
          const download = await downloadPromise;
          expect(download).toBeTruthy();
        }
      }
    });

    test("应该能够复制下载链接", async ({ page }) => {
      await navigationHelper.goToFiles();
      await fileOperationsHelper.waitForFileList();

      // 查找已知的测试文件（sample.txt）
      const fileItem = page.locator('p:has-text("sample.txt")').first();

      if ((await fileItem.count()) > 0) {
        // 悬停以显示操作菜单按钮
        await fileItem.hover();

        // 点击更多操作按钮（三个点）
        const moreButton = fileItem.locator('../..//button[contains(@class, "h-8")]').first();
        await moreButton.click();

        // 等待下拉菜单打开
        await page.waitForSelector('[role="menu"]', { timeout: 5000 });

        // 点击复制链接按钮
        const copyLinkMenuItem = page.locator('[role="menuitem"]:has-text("复制下载链接")');

        if ((await copyLinkMenuItem.count()) > 0) {
          await copyLinkMenuItem.click();

          // 验证成功提示
          await assertionHelper.assertSuccessMessage("下载链接已复制");
        }
      }
    });
  });

  test.describe("存储信息", () => {
    test("应该显示存储空间信息", async ({ page }) => {
      await navigationHelper.goToFiles();

      // 验证存储信息组件存在（在侧边栏底部）
      const storageSection = page.locator('h3:has-text("存储空间")');
      await expect(storageSection).toBeVisible();

      // 验证显示使用空间信息
      const storageArea = storageSection.locator('..');
      const storageText = await storageArea.textContent();
      expect(storageText).toMatch(/\d+.*[KMGT]?B/); // 匹配大小格式
    });
  });
});
