import fs from "node:fs";
import path from "node:path";
import type { FullConfig } from "@playwright/test";

/**
 * Playwright 全局清理
 *
 * 在所有测试完成后执行，用于清理测试环境：
 * - 删除测试文件和目录
 * - 清理测试配置
 * - 重置环境状态
 */
async function globalTeardown(_config: FullConfig) {
  console.log("🧹 开始清理 E2E 测试环境...");

  try {
    // 清理测试上传目录
    const testUploadDir = path.join(process.cwd(), "test-uploads");
    if (fs.existsSync(testUploadDir)) {
      fs.rmSync(testUploadDir, { recursive: true, force: true });
      console.log("✅ 测试上传目录已清理:", testUploadDir);
    }

    // 清理测试文档目录
    const testDocumentsDir = path.join(process.cwd(), "test-documents");
    if (fs.existsSync(testDocumentsDir)) {
      fs.rmSync(testDocumentsDir, { recursive: true, force: true });
      console.log("✅ 测试文档目录已清理:", testDocumentsDir);
    }

    // 清理测试配置目录
    const testConfigDir = path.join(process.cwd(), "test-config");
    if (fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true, force: true });
      console.log("✅ 测试配置目录已清理:", testConfigDir);
    }

    // 清理测试结果目录中的临时文件（保留报告）
    const testResultsDir = path.join(process.cwd(), "e2e/test-results");
    if (fs.existsSync(testResultsDir)) {
      const entries = fs.readdirSync(testResultsDir);
      for (const entry of entries) {
        const entryPath = path.join(testResultsDir, entry);
        const stat = fs.statSync(entryPath);

        // 只清理超过 7 天的文件（保留最近的测试结果）
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (stat.mtime.getTime() < sevenDaysAgo) {
          if (stat.isDirectory()) {
            fs.rmSync(entryPath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(entryPath);
          }
          console.log(`✅ 清理旧测试结果: ${entry}`);
        }
      }
    }

    console.log("🎉 E2E 测试环境清理完成!");
  } catch (error) {
    console.error("❌ 清理测试环境时出错:", error);
    // 不抛出错误，避免影响测试结果
  }
}

export default globalTeardown;
