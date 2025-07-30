import { expect, test } from "@playwright/test";
import {
  AssertionHelper,
  AuthHelper,
  NavigationHelper,
} from "../utils/test-helpers";

/**
 * 用户认证功能测试
 *
 * 测试 Storkitty 系统的用户登录、登出和认证状态管理功能
 */
test.describe("用户认证", () => {
  let authHelper: AuthHelper;
  let navigationHelper: NavigationHelper;
  let assertionHelper: AssertionHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    navigationHelper = new NavigationHelper(page);
    assertionHelper = new AssertionHelper(page);
  });

  test("应该能够成功登录", async ({ page }) => {
    // 导航到登录页面
    await navigationHelper.goToLogin();

    // 验证登录页面加载正确
    await assertionHelper.assertPageURL(/\/login/);
    await assertionHelper.assertElementExists(
      'input[type="text"], input[type="email"]',
    );
    await assertionHelper.assertElementExists('input[type="password"]');
    await assertionHelper.assertElementExists('button[type="submit"]');

    // 执行登录
    await authHelper.login();

    // 验证登录成功并跳转到文件管理页面
    await assertionHelper.assertPageURL(/\/files/);

    // 验证已登录状态
    const isLoggedIn = await authHelper.isLoggedIn();
    expect(isLoggedIn).toBe(true);
  });

  test("应该拒绝错误的登录凭据", async ({ page }) => {
    await navigationHelper.goToLogin();

    // 使用错误的凭据尝试登录
    await page.fill('input[type="text"], input[type="email"]', "wronguser");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // 等待登录请求完成和错误消息显示
    await page.waitForLoadState('networkidle');
    
    // 验证仍在登录页面
    await assertionHelper.assertPageURL(/\/login/);

    // 验证显示错误消息
    await assertionHelper.assertErrorMessage();
  });

  test("应该能够登出", async ({ page }) => {
    // 先登录
    await authHelper.login();
    await assertionHelper.assertPageURL(/\/files/);

    // 执行登出
    await authHelper.logout();

    // 验证跳转回登录页面
    await assertionHelper.assertPageURL(/\/login/);

    // 验证已登出状态
    const isLoggedIn = await authHelper.isLoggedIn();
    expect(isLoggedIn).toBe(false);
  });

  test("应该在未登录时重定向到登录页面", async ({ page }) => {
    // 清除可能存在的认证信息（更安全的方式）
    await page.context().clearCookies();
    try {
      await page.evaluate(() => localStorage.clear());
    } catch (error) {
      // 忽略 localStorage 访问错误，继续测试
      console.log("localStorage access denied, continuing test...");
    }

    // 尝试直接访问文件管理页面
    await page.goto("/files");

    // 应该被重定向到登录页面
    await assertionHelper.assertPageURL(/\/login/);
  });

  test("应该在登录后保持会话状态", async ({ page }) => {
    // 登录
    await authHelper.login();
    await assertionHelper.assertPageURL(/\/files/);

    // 刷新页面
    await page.reload();
    await navigationHelper.waitForPageLoad();

    // 验证仍然在文件管理页面（会话保持）
    await assertionHelper.assertPageURL(/\/files/);

    const isLoggedIn = await authHelper.isLoggedIn();
    expect(isLoggedIn).toBe(true);
  });

  test("应该验证 JWT token 有效性", async ({ page }) => {
    // 登录并获取 token
    await authHelper.login();
    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeTruthy();

    // 设置无效的 token
    await page.evaluate(() => localStorage.setItem("token", "invalid-token"));

    // 尝试访问需要认证的页面
    await page.goto("/files");

    // 应该被重定向到登录页面
    await assertionHelper.assertPageURL(/\/login/);
  });

  test("应该处理空的登录表单", async ({ page }) => {
    await navigationHelper.goToLogin();

    // 尝试提交空表单
    await page.click('button[type="submit"]');

    // 验证仍在登录页面
    await assertionHelper.assertPageURL(/\/login/);

    // 验证表单验证消息或错误提示（使用正确的选择器）
    const errorAlert = page.locator('[data-slot="alert"][role="alert"]');
    await expect(errorAlert).toBeVisible();
    
    // 验证错误消息内容
    await expect(errorAlert).toContainText("请填写用户名和密码");
  });
});
