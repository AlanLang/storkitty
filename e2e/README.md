# Storkitty E2E 测试文档

## 概述

此目录包含 Storkitty 文件管理系统的端到端（E2E）测试，使用 Playwright + TypeScript 构建。测试覆盖了用户认证和文件管理等核心功能。

## 目录结构

```
e2e/
├── tests/                    # 测试用例文件
│   ├── auth.spec.ts         # 用户认证测试
│   └── file-management.spec.ts # 文件管理功能测试
├── utils/                   # 工具函数和助手
│   ├── test-helpers.ts      # 测试助手类和工具函数
│   ├── global-setup.ts      # 全局测试环境设置
│   └── global-teardown.ts   # 全局测试环境清理
├── fixtures/                # 测试数据和配置
│   └── test-config.toml     # 测试环境配置文件
├── test-results/           # 测试结果和报告（自动生成）
├── tsconfig.json           # TypeScript 配置
└── README.md               # 本文档
```

## 快速开始

### 1. 安装依赖

```bash
# 安装 Node.js 依赖（如果还未安装）
bun install

# 安装 Playwright 浏览器
bunx playwright install
```

### 2. 准备测试环境

确保 Rust 后端可以正常运行：

```bash
# 构建前端资源
bun run build

# 启动 Rust 服务器（测试会自动启动，也可手动启动）
cargo run
```

### 3. 运行测试

```bash
# 运行所有 E2E 测试
bun run test:e2e

# 在有头浏览器中运行（可观察测试过程）
bun run test:e2e:headed

# 使用 Playwright UI 模式运行
bun run test:e2e:ui

# 调试模式运行（逐步执行）
bun run test:e2e:debug

# 查看测试报告
bun run test:e2e:report
```

### 4. 查看测试结果

测试完成后，可以查看详细的 HTML 报告：

```bash
bun run test:e2e:report
```

报告将在浏览器中打开，显示测试结果、截图、视频录制等信息。

**注意**: 测试报告存储在 `e2e/reports/` 目录中，与测试结果文件分离以避免冲突。

### 5. 代码质量检查

E2E 测试代码使用独立的 Biome 配置，允许更宽松的规则：

```bash
# 检查和修复 E2E 测试代码
bun run test:e2e:check

# 检查主项目代码（不包括 E2E 测试）
bun run check
```

E2E 测试代码的特殊规则：
- 允许使用默认导出（Playwright 配置要求）
- 允许未使用的函数参数（测试框架注入的参数）
- 允许未使用的变量（测试数据和临时变量）
- 强制使用 Node.js 导入协议（`node:fs`、`node:path` 等）

## 测试用例说明

### 认证测试 (auth.spec.ts)

- ✅ 成功登录
- ✅ 拒绝错误凭据
- ✅ 用户登出
- ✅ 未登录重定向
- ✅ 会话状态保持
- ✅ JWT token 验证
- ✅ 表单验证

### 文件管理测试 (file-management.spec.ts)

- ✅ 文件列表显示
- ✅ 文件元数据显示
- ✅ 目录导航
- ✅ 单文件上传
- ✅ 上传进度显示
- ✅ 创建新目录
- ✅ 目录名称验证
- ✅ 文件重命名
- ✅ 文件删除
- ✅ 删除确认
- ✅ 文件下载
- ✅ 复制下载链接
- ✅ 存储空间信息


## 测试工具和助手

### 主要助手类

- **NavigationHelper**: 页面导航工具
- **AuthHelper**: 认证相关操作
- **FileOperationsHelper**: 文件操作工具
- **AssertionHelper**: 断言和验证工具
- **TestUtils**: 通用工具函数
- **TestDataFactory**: 测试数据生成

### 配置文件

- **test-config.toml**: 测试环境的系统配置
- **playwright.config.ts**: Playwright 测试框架配置
- **tsconfig.json**: TypeScript 编译配置

## 测试最佳实践

### 1. 测试隔离

每个测试用例都是独立的，不依赖其他测试的状态：

```typescript
test.beforeEach(async ({ page }) => {
  // 每个测试前都重新登录
  await authHelper.login();
});
```

### 2. 数据清理

使用随机生成的测试数据，避免测试间冲突：

```typescript
const testFileName = TestUtils.generateRandomFileName();
const testDirName = TestUtils.generateRandomDirectoryName();
```

### 3. 等待策略

使用适当的等待策略确保测试稳定性：

```typescript
// 等待网络请求完成
await page.waitForLoadState('networkidle');

// 等待元素可见
await expect(element).toBeVisible();

// 等待 URL 变化
await page.waitForURL(/\/files/, { timeout: 5000 });
```

### 4. 错误处理

测试包含完善的错误处理和清理逻辑：

```typescript
try {
  await fileOperationsHelper.uploadFile(tempFilePath);
  await assertionHelper.assertFileExists(fileName);
} finally {
  // 清理临时文件
  if (fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
  }
}
```

## 测试环境配置

### 测试配置文件

测试使用独立的配置文件 `e2e/fixtures/test-config.toml`，包含：

- 测试用户凭据（admin/admin123）
- 测试存储目录配置
- 测试环境权限设置

### 全局设置

`global-setup.ts` 在测试开始前：

- 创建测试配置文件
- 创建测试存储目录
- 准备测试数据文件

`global-teardown.ts` 在测试结束后：

- 清理测试文件和目录
- 清理过期的测试结果
- 重置环境状态

## 调试和故障排除

### 查看测试过程

```bash
# 有头模式运行，可观察浏览器操作
bun run test:e2e:headed

# UI 模式，交互式运行和调试
bun run test:e2e:ui
```

### 查看失败详情

测试失败时会自动：

- 截取错误时的屏幕截图
- 录制操作视频
- 生成浏览器追踪信息

所有信息都保存在 `e2e/test-results/` 目录中。

### 常见问题

1. **服务器启动失败**: 确保端口 3331 未被占用
2. **浏览器安装失败**: 运行 `bunx playwright install`
3. **测试超时**: 检查网络连接和服务器响应时间
4. **文件权限错误**: 确保测试目录有读写权限

## 持续集成

测试配置已针对 CI 环境优化：

```typescript
// CI 环境配置
retries: process.env.CI ? 0 : 1,
workers: process.env.CI ? 1 : undefined,
```

在 CI 中运行时：

- 不重试失败的测试
- 使用单线程执行
- 自动启动测试服务器
- 生成详细的测试报告

## 扩展测试

### 添加新测试用例

1. 在相应的 `.spec.ts` 文件中添加测试
2. 使用现有的助手类和工具函数
3. 遵循测试命名约定
4. 添加适当的断言和清理逻辑

### 添加新的助手函数

在 `test-helpers.ts` 中添加新的助手类或工具函数：

```typescript
export class NewFeatureHelper {
  constructor(private page: Page) {}
  
  async performNewOperation() {
    // 实现新的操作逻辑
  }
}
```

## 总结

这套 E2E 测试提供了 Storkitty 系统的全面测试覆盖，确保核心功能的稳定性和用户体验质量。测试框架具有良好的可扩展性和维护性，支持持续集成和自动化测试流程。