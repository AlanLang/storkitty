pub fn create_dir(path: &str) -> anyhow::Result<()> {
  std::fs::create_dir_all(path)?;
  Ok(())
}

pub fn is_system_file(path: &str) -> bool {
  let file_name = path.split('/').next_back().unwrap_or_default();
  let reserved_names = [
    ".",
    "..",
    ".DS_Store",
    ".chunks",
    "Thumbs.db",
    "__pycache__",
    ".git",
    ".svn",
    "node_modules",
    ".gitkeep",
    "desktop.ini",
    ".storkitty",
  ];
  reserved_names.contains(&file_name)
}
