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

      // 关闭上传抽屉
      await page.keyboard.press('Escape');

      // 等待文件列表刷新
      await page.waitForTimeout(3000);
      await fileOperationsHelper.waitForFileList();

      // 验证文件出现在文件列表中
      const uploadedFile = await fileOperationsHelper.findFile(fileName);
      await expect(uploadedFile).toBeVisible();

      console.log(`✅ 大文件 "${fileName}" 上传成功`);

      // 验证文件大小显示正确（应该显示为15MB左右）
      // 根据文件卡片结构，文件大小在文件名下方的第二个p标签中
      const fileNameElement = page.locator(`[title="${fileName}"]`);
      const fileSizeElement = fileNameElement.locator('..').locator('p').nth(1); // 第二个p标签包含文件大小
      const sizeContent = await fileSizeElement.textContent();
      
      // 验证大小显示包含MB单位且接近15MB
      expect(sizeContent).toMatch(/1[4-6]\.\d\s*MB/); // 允许14-16MB的范围，考虑格式化误差

      console.log(`✅ 文件大小验证通过: ${sizeContent}`);

    } finally {
      // 清理临时文件
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  });
});