import { expect, test } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  AuthHelper,
  FileOperationsHelper,
  NavigationHelper,
  TestUtils,
} from "../utils/test-helpers";

/**
 * 大文件分片上传测试
 *
 * 测试系统对大文件（>10MB）的分片上传功能
 */
test.describe("大文件分片上传", () => {
  let authHelper: AuthHelper;
  let navigationHelper: NavigationHelper;
  let fileOperationsHelper: FileOperationsHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    navigationHelper = new NavigationHelper(page);
    fileOperationsHelper = new FileOperationsHelper(page);

    // 登录
    await authHelper.login();
  });

  test("应该能够成功上传大文件并验证文件信息", async ({ page }) => {
    await navigationHelper.goToFiles();

    // 创建一个15MB的测试文件（超过10MB分片阈值）
    const fileSizeMB = 15;
    const tempFilePath = await TestUtils.createLargeFile(fileSizeMB, ".txt");
    const fileName = path.basename(tempFilePath);

    try {
      console.log(`开始上传大文件: ${fileName} (${fileSizeMB}MB)`);

      // 打开上传抽屉
      const uploadButton = page.locator('button:has-text("上传")');
      await uploadButton.click();

      // 等待抽屉打开
      await page.waitForSelector('.translate-x-0', { timeout: 5000 });

      // 选择大文件
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(tempFilePath);

      // 等待文件被添加到上传列表
      await page.waitForSelector('.space-y-3 > *, [class*="Card"]', { timeout: 5000 });

      // 验证文件显示为分片上传（可以通过文件大小判断）
      const fileItem = page.locator(`.space-y-3 p:has-text("${fileName}")`);
      await expect(fileItem).toBeVisible();

      // 点击开始上传
      const startUploadButton = page.locator('button[class*="flex-1"]:has-text("上传")');
      await startUploadButton.click();

      // 等待分片上传完成
      console.log("等待分片上传完成...");
      await page.waitForSelector(
        '.text-green-500, svg[class*="CheckCircle"], :has-text("已完成")', 
        { timeout: 15000 } // 15秒超时
      );

      // 关闭上传抽屉 - 使用更可靠的关闭方法
      const closeButton = page.locator('.translate-x-0 button.h-8.w-8, .translate-x-0 button:has-text("×"), .translate-x-0 button[class*="h-8"][class*="w-8"]').first();
      
      if (await closeButton.count() > 0) {
        await closeButton.waitFor({ state: 'visible', timeout: 5000 });
        await closeButton.click();
        console.log("点击关闭按钮关闭上传抽屉");
      } else {
        // 备用方法：使用 ESC 键
        await page.keyboard.press('Escape');
        console.log("使用 ESC 键关闭上传抽屉");
      }
      
      // 等待抽屉完全关闭
      await page.waitForSelector('.translate-x-0', { state: 'hidden', timeout: 5000 });
      console.log("上传抽屉已关闭");

      // 等待文件列表刷新
      await page.waitForTimeout(3000);
      await fileOperationsHelper.waitForFileList();

      // 验证文件出现在文件列表中
      const uploadedFile = await fileOperationsHelper.findFile(fileName);
      await expect(uploadedFile).toBeVisible();

      console.log(`✅ 大文件 "${fileName}" 上传成功`);

      // 验证文件大小显示正确（应该显示为15MB左右）
      // 直接从文件名元素的父容器中找到大小信息
      const uploadedFileElement = await fileOperationsHelper.findFile(fileName);
      await expect(uploadedFileElement).toBeVisible();
      
      // 从文件名的父容器中找到文件大小信息（就在文件名下方）
      const fileSizeElement = uploadedFileElement.locator('..').locator('p.text-xs.text-muted-foreground');
      const sizeContent = await fileSizeElement.textContent();
      
      console.log(`文件大小显示内容: "${sizeContent}"`);
      
      // 验证大小显示包含MB单位且接近15MB
      expect(sizeContent).toMatch(/1[4-6]\.\d+\s*MB/); // 允许14-16MB的范围，考虑格式化误差

      console.log(`✅ 文件大小验证通过: ${sizeContent}`);

    } finally {
      // 清理临时文件
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  });
});