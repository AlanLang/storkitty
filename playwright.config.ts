import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E 测试配置
 *
 * 此配置文件为 Storkitty 文件管理系统定义了 E2E 测试环境。
 * 包含多个浏览器环境和测试配置选项。
 */
export default defineConfig({
  // 测试文件目录
  testDir: "./e2e/tests",

  // 全局测试超时时间 (30秒)
  timeout: 30 * 1000,

  // 断言超时时间 (5秒)
  expect: {
    timeout: 5000,
  },

  // 测试失败时不会立即停止其他测试
  fullyParallel: true,

  // 在 CI 环境中失败时不重试，本地环境允许 1 次重试
  retries: process.env.CI ? 0 : 1,

  // 本地并行工作进程数
  workers: process.env.CI ? 1 : undefined,

  // 全局设置和清理
  globalSetup: "./e2e/utils/global-setup.ts",
  globalTeardown: "./e2e/utils/global-teardown.ts",

  // 测试报告配置
  reporter: [
    ["html", { outputFolder: "e2e/reports/html-report" }],
    ["json", { outputFile: "e2e/reports/test-results.json" }],
    ["list"],
  ],

  // 全局配置
  use: {
    // 基础 URL - 测试将访问的应用地址
    baseURL: "http://localhost:3331",

    // 测试失败时截图
    screenshot: "only-on-failure",

    // 测试失败时录制视频
    video: "retain-on-failure",

    // 浏览器追踪（用于调试）
    trace: "on-first-retry",

    // 忽略 HTTPS 错误
    ignoreHTTPSErrors: true,
  },

  // 测试项目配置 - 只使用 Chromium 浏览器
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // 设置视口大小，适合文件管理界面测试
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  // 测试服务器配置
  webServer: {
    // 启动 Rust 服务器的命令，使用测试配置文件
    command: "CONFIG_PATH=e2e/fixtures/test-config.toml cargo run --bin storkitty",
    port: 3331,
    reuseExistingServer: !process.env.CI,
    // 等待服务器启动的超时时间
    timeout: 120 * 1000,
  },

  // 输出目录
  outputDir: "e2e/test-results/",
});
