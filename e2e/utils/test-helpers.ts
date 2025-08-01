import { type Page, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

/**
 * E2E 测试工具函数
 *
 * 包含用于 Storkitty 文件管理系统测试的常用功能函数
 */

// 应用配置
export const APP_CONFIG = {
  baseURL: "http://localhost:3331",
  timeout: {
    short: 5000, // 5秒 - 用于快速操作
    medium: 15000, // 15秒 - 用于一般操作
    long: 30000, // 30秒 - 用于文件上传等耗时操作
  },
};

// 测试用户凭据（需要与测试配置文件匹配）
export const TEST_CREDENTIALS = {
  username: "admin",
  password: "admin123",
  email: "admin@storkitty.com",
};

/**
 * 页面导航工具
 */
export class NavigationHelper {
  constructor(private page: Page) {}

  // 导航到登录页面
  async goToLogin() {
    await this.page.goto("/login");
    await this.page.waitForLoadState("networkidle");
  }

  // 导航到文件管理页面
  async goToFiles() {
    await this.page.goto("/files");
    await this.page.waitForLoadState("networkidle");
  }

  // 导航到特定目录 - 通过点击侧边栏目录按钮
  async goToDirectory(directoryName: string, path?: string) {
    // 首先导航到文件页面以确保侧边栏已加载
    await this.goToFiles();
    
    // 点击侧边栏中的目录按钮
    const directoryButton = this.page.locator(`button:has-text("${directoryName}")`);
    await directoryButton.click();
    
    // 等待页面加载
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(1000); // 额外等待确保目录切换完成
    
    // 如果指定了路径，再导航到该路径
    if (path) {
      const folderItem = this.page.locator(`p:has-text("${path}")`).first();
      await folderItem.click();
      await this.page.waitForLoadState("networkidle");
    }
  }

  // 等待页面完全加载
  async waitForPageLoad() {
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(1000); // 额外等待确保所有异步操作完成
  }
}

/**
 * 认证相关工具
 */
export class AuthHelper {
  constructor(private page: Page) {}

  // 执行登录操作
  async login(
    username: string = TEST_CREDENTIALS.username,
    password: string = TEST_CREDENTIALS.password,
  ) {
    await this.page.goto("/login");

    // 填写登录表单
    await this.page.fill('input[type="text"], input[type="email"]', username);
    await this.page.fill('input[type="password"]', password);

    // 点击登录按钮
    await this.page.click('button[type="submit"]');

    // 等待登录成功跳转
    await this.page.waitForURL("/files", {
      timeout: APP_CONFIG.timeout.medium,
    });
    await this.page.waitForLoadState("networkidle");
  }

  // 执行登出操作
  async logout() {
    // 查找并点击登出按钮（可能在用户菜单中）
    const logoutButton = this.page.locator(
      'button:has-text("登出"), button:has-text("退出"), button:has-text("Logout")',
    );
    if ((await logoutButton.count()) > 0) {
      await logoutButton.click();
    } else {
      // 如果没有明显的登出按钮，清除 localStorage
      await this.page.evaluate(() => localStorage.clear());
      await this.page.reload();
    }

    // 等待跳转到登录页面
    await this.page.waitForURL("/login", {
      timeout: APP_CONFIG.timeout.medium,
    });
  }

  // 检查是否已登录
  async isLoggedIn(): Promise<boolean> {
    const token = await this.page.evaluate(() => localStorage.getItem("token"));
    return !!token;
  }

  // 直接设置认证令牌（用于跳过登录步骤）
  async setAuthToken(token: string) {
    await this.page.evaluate((tokenValue) => {
      localStorage.setItem("token", tokenValue);
    }, token);
  }
}

/**
 * 文件操作工具
 */
export class FileOperationsHelper {
  constructor(private page: Page) {}

  // 等待文件列表加载完成
  async waitForFileList() {
    // 等待主要的文件区域加载
    await this.page.waitForSelector(
      '.grid, .space-y-1, [class*="grid-cols"], [class*="space-y"]',
      {
        timeout: APP_CONFIG.timeout.medium,
      },
    );
    
    // 等待加载完成（没有加载动画）
    await this.page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 5000 });
  }

  // 获取文件列表中的所有文件（列表项）
  async getFileList() {
    await this.waitForFileList();
    // 查找所有文件列表项
    const listItems = this.page.locator('[data-testid="file-list"] > div[class*="flex"][class*="items-center"]');
    return await listItems.all();
  }

  // 查找特定名称的文件
  async findFile(fileName: string) {
    await this.waitForFileList();
    // 在主文件区域中查找文件，避免抽屉中的文件
    return this.page.locator(`main [title="${fileName}"], main p:has-text("${fileName}")`).first();
  }

  // 上传文件
  async uploadFile(filePath: string) {
    // 打开上传抽屉界面 - 使用更具体的选择器避免冲突
    const uploadButton = this.page.locator('button:has-text("上传")').first();
    await uploadButton.click();

    // 等待抽屉打开 - 检查抽屉的translate-x-0类
    await this.page.waitForSelector('.translate-x-0', { timeout: 5000 });

    // 选择文件 - 在上传区域中查找文件输入框
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // 等待文件被添加到列表（文件项出现）
    await this.page.waitForSelector('.space-y-3 > *, [class*="Card"]', { timeout: 5000 });

    // 点击上传按钮开始上传
    const startUploadButton = this.page.locator('button[class*="flex-1"]:has-text("上传")');
    await startUploadButton.click();

    // 等待上传完成 - 检查成功状态的图标或者已完成文字
    await this.page.waitForSelector('.text-green-500, svg[class*="CheckCircle"], :has-text("已完成")', { timeout: 15000 });
    
    // 自动关闭上传抽屉 - 点击右上角的X关闭按钮
    const closeButton = this.page.locator('.translate-x-0 button.h-8.w-8, .translate-x-0 button:has-text("×"), .translate-x-0 button[class*="h-8"][class*="w-8"]').first();
    
    // 等待关闭按钮可见并点击
    await closeButton.waitFor({ state: 'visible', timeout: 5000 });
    await closeButton.click();
    
    // 等待抽屉关闭动画完成
    await this.page.waitForTimeout(1000);
    
    // 等待网络请求完成，确保文件列表已更新
    await this.page.waitForLoadState("networkidle");
  }

  // 创建文件夹
  async createDirectory(directoryName: string) {
    // 打开创建文件夹对话框
    const createButton = this.page.locator('button:has-text("新建文件夹")');
    await createButton.click();

    // 等待对话框打开
    await this.page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // 填写文件夹名称 - 使用更精确的选择器
    const nameInput = this.page.locator('input[id="directory-name"], input[placeholder="请输入文件夹名称"]');
    await nameInput.fill(directoryName);

    // 确认创建
    const confirmButton = this.page.locator('button:has-text("创建")');
    await confirmButton.click();

    // 等待对话框关闭
    await this.page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
    
    // 等待网络请求完成
    await this.page.waitForLoadState("networkidle");
  }

  // 点击文件的操作菜单项
  async clickFileMenuAction(fileName: string, menuAction: string) {
    // 找到文件
    const fileItem = await this.findFile(fileName);
    
    // 显示操作按钮并点击
    await this.showMoreActionsButton(fileItem, fileName);
    const moreButton = this.page.getByTestId(`file-more-actions-button-${fileName}`);
    await moreButton.click();

    // 等待下拉菜单打开
    await this.page.waitForSelector('[role="menu"]', { timeout: 5000 });

    // 点击指定的菜单项
    const menuItem = this.page.locator(`[role="menuitem"]:has-text("${menuAction}")`);
    await menuItem.click();
  }

  // 确认删除对话框操作
  async confirmDeleteDialog(shouldConfirm: boolean = true, confirmationText?: string) {
    // 等待确认对话框打开
    await this.page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    if (confirmationText) {
      // 对于需要输入确认文本的删除（如非空文件夹）
      const confirmInput = this.page.locator('#confirm-input');
      await confirmInput.waitFor({ state: 'visible', timeout: 5000 });
      await confirmInput.fill(confirmationText);
      await this.page.waitForTimeout(500);
    }

    if (shouldConfirm) {
      // 确认删除
      const confirmButton = this.page.locator('button:has-text("确认删除")');
      await confirmButton.waitFor({ state: 'visible', timeout: 5000 });
      
      // 等待按钮可用
      await this.page.waitForFunction(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const confirmButton = buttons.find(btn => btn.textContent?.includes('确认删除')) as HTMLButtonElement;
        return confirmButton && !confirmButton.disabled;
      }, { timeout: 10000 });
      
      await this.page.waitForTimeout(500);
      await confirmButton.click();
    } else {
      // 取消删除
      const cancelButton = this.page.locator('button:has-text("取消")');
      await cancelButton.click();
    }

    // 等待对话框关闭
    await this.page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 15000 });
    await this.page.waitForLoadState("networkidle");
  }

  // 删除文件或文件夹（重新设计为更简单的API）
  async deleteFile(fileName: string, isFolder: boolean = false, expectedItemCount: number = 0) {
    // 点击删除菜单项
    await this.clickFileMenuAction(fileName, '删除');
    
    // 确认删除操作
    const requiresConfirmation = isFolder && expectedItemCount > 0;
    const confirmationText = requiresConfirmation ? fileName : undefined;
    await this.confirmDeleteDialog(true, confirmationText);
  }

  // 取消删除文件或文件夹
  async cancelDeleteFile(fileName: string) {
    // 点击删除菜单项
    await this.clickFileMenuAction(fileName, '删除');
    
    // 取消删除操作
    await this.confirmDeleteDialog(false);
  }

  // 验证文件存在
  async verifyFileExists(fileName: string, shouldExist: boolean = true) {
    await this.page.waitForTimeout(1000); // 等待UI更新
    
    // 使用和findFile相同的选择器策略
    const fileItems = this.page.locator(`main [title="${fileName}"], main p:has-text("${fileName}")`);
    
    if (shouldExist) {
      await expect(fileItems).toHaveCount(1, { timeout: 10000 });
    } else {
      await expect(fileItems).toHaveCount(0, { timeout: 10000 });
    }
  }

  // 验证删除对话框内容
  async verifyDeleteDialog(expectedTitle: string = '删除') {
    await this.page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    const dialogTitle = this.page.locator('[role="dialog"] h2');
    await expect(dialogTitle).toContainText(expectedTitle);
  }

  // 下载文件
  async downloadFile(fileName: string) {
    await this.clickFileMenuAction(fileName, '下载文件');
    // 注意：实际的下载验证可能需要额外的逻辑
  }

  // 复制下载链接  
  async copyDownloadLink(fileName: string) {
    await this.clickFileMenuAction(fileName, '复制链接');
    // 可以添加剪贴板验证逻辑
  }

  // 重命名文件
  async renameFile(fileName: string, newName: string) {
    await this.clickFileMenuAction(fileName, '重命名');
    
    // 等待重命名对话框（如果存在）
    await this.page.waitForTimeout(1000);
    
    // 如果有重命名对话框，填写新名称
    const nameInput = this.page.locator('input[placeholder*="名称"], input[id*="name"], input[value*="' + fileName + '"]');
    if (await nameInput.count() > 0) {
      await nameInput.selectText();
      await nameInput.fill(newName);
      const confirmButton = this.page.locator('button:has-text("重命名"):not([role="menuitem"]), button:has-text("确认"), button:has-text("保存")');
      await confirmButton.click();
      
      // 等待对话框关闭和操作完成
      await this.page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
      await this.page.waitForLoadState("networkidle");
    }
  }

  // 简化的菜单项点击（用于固定文件名，如sample.txt）
  async clickStaticFileMenuAction(fileName: string, menuAction: string) {
    // 使用JavaScript强制显示按钮（适用于测试环境中的静态文件）
    await this.page.evaluate((fileName) => {
      const button = document.querySelector(`[data-testid="file-more-actions-button-${fileName}"]`);
      if (button instanceof HTMLElement) {
        button.style.opacity = '1';
        button.style.visibility = 'visible';
        button.style.pointerEvents = 'auto';
      }
      
      const containers = document.querySelectorAll('.opacity-0.group-hover\\:opacity-100');
      containers.forEach((container: Element) => {
        if (container instanceof HTMLElement) {
          container.style.opacity = '1';
          container.style.visibility = 'visible';
        }
      });
    }, fileName);

    await this.page.waitForTimeout(300);

    const moreButton = this.page.getByTestId(`file-more-actions-button-${fileName}`);
    await moreButton.click();

    await this.page.waitForSelector('[role="menu"]', { timeout: 5000 });

    const menuItem = this.page.locator(`[role="menuitem"]:has-text("${menuAction}")`);
    await menuItem.click();
  }

  // 可靠地显示更多操作按钮的辅助方法
  private async showMoreActionsButton(fileItem: any, fileName: string) {
    // 悬停在文件项上
    await fileItem.hover();
    
    // 找到文件的父容器
    const fileContainer = fileItem.locator('..').locator('..').locator('..');
    await fileContainer.hover();
    
    // 使用JavaScript强制触发hover状态以显示特定文件的按钮
    await this.page.evaluate((fileName) => {
      // 找到特定文件的操作按钮并显示它
      const button = document.querySelector(`[data-testid="file-more-actions-button-${fileName}"]`);
      if (button instanceof HTMLElement) {
        button.style.opacity = '1';
        button.style.visibility = 'visible';
        button.style.pointerEvents = 'auto';
      }
      
      // 也强制显示包含按钮的容器
      const containers = document.querySelectorAll('.opacity-0.group-hover\\:opacity-100');
      containers.forEach((container: Element) => {
        if (container instanceof HTMLElement) {
          container.style.opacity = '1';
          container.style.visibility = 'visible';
        }
      });
    }, fileName);
    
    // 等待一小段时间让样式生效
    await this.page.waitForTimeout(300);
  }

}

/**
 * 断言工具
 */
export class AssertionHelper {
  constructor(private page: Page) {}

  // 断言页面标题
  async assertPageTitle(expectedTitle: string) {
    await expect(this.page).toHaveTitle(expectedTitle);
  }

  // 断言页面 URL
  async assertPageURL(expectedURL: string | RegExp) {
    await expect(this.page).toHaveURL(expectedURL);
  }

  // 断言元素存在
  async assertElementExists(selector: string) {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  // 断言元素包含文本
  async assertElementContainsText(selector: string, text: string) {
    await expect(this.page.locator(selector)).toContainText(text);
  }

  // 断言文件存在于列表中
  async assertFileExists(fileName: string) {
    const fileItem = this.page.locator(`main [title="${fileName}"], main p:has-text("${fileName}")`).first();
    await expect(fileItem).toBeVisible();
  }

  // 断言文件不存在于列表中
  async assertFileNotExists(fileName: string) {
    const fileItem = this.page.locator(`main [title="${fileName}"], main p:has-text("${fileName}")`);
    await expect(fileItem).not.toBeVisible();
  }

  // 断言成功消息出现
  async assertSuccessMessage(message?: string) {
    // 查找 Sonner toast 或其他成功提示
    const successLocator = this.page.locator(
      '[data-sonner-toast][data-type="success"], .text-green-500, [class*="success"]',
    );
    await expect(successLocator).toBeVisible({ timeout: 10000 });

    if (message) {
      await expect(successLocator).toContainText(message);
    }
  }

  // 断言错误消息出现
  async assertErrorMessage(message?: string) {
    // 查找 Sonner toast 或其他错误提示
    const errorLocator = this.page.locator(
      '[data-sonner-toast][data-type="error"], .text-red-500, [class*="error"], [role="alert"]',
    );
    await expect(errorLocator).toBeVisible({ timeout: 10000 });

    if (message) {
      await expect(errorLocator).toContainText(message);
    }
  }
}

/**
 * 工具函数
 */
export class TestUtils {
  // 生成随机文件名
  static generateRandomFileName(extension = ".txt"): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `test-file-${timestamp}-${random}${extension}`;
  }

  // 生成随机目录名
  static generateRandomDirectoryName(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `test-dir-${timestamp}-${random}`;
  }

  // 创建临时测试文件
  static async createTempFile(
    content = "Test file content",
    extension = ".txt",
  ): Promise<string> {
    const fileName = this.generateRandomFileName(extension);
    const filePath = path.join(os.tmpdir(), fileName);

    fs.writeFileSync(filePath, content);
    return filePath;
  }

  // 创建大文件用于分片上传测试
  static async createLargeFile(
    sizeMB: number,
    extension = ".txt",
  ): Promise<string> {
    const fileName = this.generateRandomFileName(extension);
    const filePath = path.join(os.tmpdir(), fileName);
    
    // 使用流写入以避免内存溢出
    const writeStream = fs.createWriteStream(filePath);
    const chunkSize = 1024 * 1024; // 1MB chunks
    const totalBytes = sizeMB * 1024 * 1024;
    const chunk = Buffer.alloc(chunkSize, 'A');
    
    return new Promise((resolve, reject) => {
      let written = 0;
      
      const writeChunk = () => {
        if (written >= totalBytes) {
          writeStream.end();
          resolve(filePath);
          return;
        }
        
        const remainingBytes = totalBytes - written;
        const currentChunkSize = Math.min(chunkSize, remainingBytes);
        const currentChunk = currentChunkSize === chunkSize ? chunk : Buffer.alloc(currentChunkSize, 'A');
        
        writeStream.write(currentChunk, (err) => {
          if (err) {
            reject(err);
            return;
          }
          written += currentChunkSize;
          setImmediate(writeChunk);
        });
      };
      
      writeStream.on('error', reject);
      writeChunk();
    });
  }

  // 等待指定时间
  static async wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}

/**
 * 测试数据工厂
 */
export class TestDataFactory {
  // 创建测试用户数据
  static createTestUser() {
    return {
      username: `testuser_${Date.now()}`,
      password: "TestPassword123!",
      email: `test_${Date.now()}@example.com`,
    };
  }

  // 创建测试文件数据
  static createTestFileData() {
    return {
      name: TestUtils.generateRandomFileName(),
      content: "This is test file content created by E2E tests.",
      size: 1024,
    };
  }

  // 创建测试目录数据
  static createTestDirectoryData() {
    return {
      name: TestUtils.generateRandomDirectoryName(),
      description: "Test directory created by E2E tests",
    };
  }
}
