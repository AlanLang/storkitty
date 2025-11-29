/// 常见系统保留名（可以按需补充）
const RESERVED_NAMES: &[&str] = &[
  ".",
  "..",
  ".DS_Store", // macOS
  "CON",
  "PRN",
  "AUX",
  "NUL", // Windows
  "COM1",
  "COM2",
  "COM3",
  "COM4",
  "COM5",
  "COM6",
  "COM7",
  "COM8",
  "COM9",
  "LPT1",
  "LPT2",
  "LPT3",
  "LPT4",
  "LPT5",
  "LPT6",
  "LPT7",
  "LPT8",
  "LPT9",
];

/// 创建文件夹名称校验
pub fn validate_name(name: &str) -> bool {
  // 为空直接不合法
  if name.is_empty() {
    return false;
  }

  // 全是空白也不太合理
  if name.trim().is_empty() {
    return false;
  }

  // 长度限制 (255 bytes)
  if name.len() > 255 {
    return false;
  }

  // 禁止保留名字（忽略大小写）
  if RESERVED_NAMES.iter().any(|r| r.eq_ignore_ascii_case(name)) {
    return false;
  }

  // 禁止路径分隔符（兼容 Unix / Windows）
  if name.contains('/') || name.contains('\\') {
    return false;
  }

  // 禁止的特殊字符（Windows 典型非法字符）
  const FORBIDDEN_CHARS: &[char] = &['<', '>', ':', '"', '|', '?', '*'];

  // 禁止控制字符 + 特殊字符
  if name
    .chars()
    .any(|c| c.is_control() || FORBIDDEN_CHARS.contains(&c))
  {
    return false;
  }

  // （可选）禁止以空格或点结尾，避免某些系统上的奇怪行为
  if name.ends_with(' ') || name.ends_with('.') {
    return false;
  }

  true
}

pub fn validate_path(path: &str) -> bool {
  if path.is_empty() {
    return false;
  }

  // 禁止 home 路径
  if path.starts_with("~/") {
    return false;
  }

  // 禁止 Windows 风格路径 C:\
  if path.len() > 2 && path.as_bytes()[1] == b':' {
    return false;
  }

  // 禁止 `..` 越界
  if path.contains("..") {
    return false;
  }

  // 分割并校验每一段
  for segment in path.split('/') {
    if !segment.is_empty() && !validate_name(segment) {
      return false;
    }
  }

  true
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_validate_path() {
    assert!(validate_path("/data"));
  }

  #[test]
  fn test_validate_name() {
    assert!(validate_name("demo"));
  }

  #[test]
  fn test_validate_name_length() {
    let long_name = "a".repeat(256);
    assert!(!validate_name(&long_name));
    let max_name = "a".repeat(255);
    assert!(validate_name(&max_name));
  }
}
