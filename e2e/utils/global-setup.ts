import * as fs from "node:fs";
import * as path from "node:path";
import type { FullConfig } from "@playwright/test";

/**
 * Playwright 全局设置
 *
 * 在所有测试开始前执行，用于准备测试环境：
 * - 创建测试配置文件
 * - 创建测试目录
 * - 设置测试数据
 */
async function globalSetup(_config: FullConfig) {
  console.log("🚀 开始设置 E2E 测试环境...");

  // 确保测试配置文件存在
  const configPath = path.join(
    process.cwd(),
    "e2e/fixtures/test-config.toml",
  );
  
  if (fs.existsSync(configPath)) {
    console.log("✅ 测试配置文件已存在:", configPath);
  } else {
    throw new Error(`测试配置文件不存在: ${configPath}`);
  }

  // 创建测试存储目录
  const testUploadDir = path.join(process.cwd(), "test-uploads");
  const testDocumentsDir = path.join(process.cwd(), "test-documents");

  if (!fs.existsSync(testUploadDir)) {
    fs.mkdirSync(testUploadDir, { recursive: true });
    console.log("✅ 测试上传目录已创建:", testUploadDir);
  }

  if (!fs.existsSync(testDocumentsDir)) {
    fs.mkdirSync(testDocumentsDir, { recursive: true });
    console.log("✅ 测试文档目录已创建:", testDocumentsDir);
  }

  // 创建测试文件
  const testFiles = [
    { name: "sample.txt", content: "This is a sample text file for testing." },
    { name: "test-image.txt", content: "Mock image file content" }, // 模拟图片文件
    { name: "document.pdf", content: "Mock PDF file content" }, // 模拟PDF文件
  ];

  for (const file of testFiles) {
    const filePath = path.join(testUploadDir, file.name);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, file.content);
      console.log(`✅ 测试文件已创建: ${file.name}`);
    }
  }

  // 创建测试子目录
  const testSubDir = path.join(testUploadDir, "test-subfolder");
  if (!fs.existsSync(testSubDir)) {
    fs.mkdirSync(testSubDir);
    fs.writeFileSync(
      path.join(testSubDir, "nested-file.txt"),
      "File in subdirectory",
    );
    console.log("✅ 测试子目录已创建: test-subfolder");
  }

  console.log("🎉 E2E 测试环境设置完成!");

  // 可选: 启动浏览器进行额外的设置
  // const browser = await chromium.launch();
  // const page = await browser.newPage();
  // 执行一些预设置操作...
  // await browser.close();
}

export default globalSetup;
