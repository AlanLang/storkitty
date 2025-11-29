pub fn split_path(path: &str) -> (String, Option<String>) {
  let parts = path
    .trim()
    .trim_start_matches('/')
    .split('/')
    .collect::<Vec<&str>>();
  (
    parts[0].to_string(),
    if parts.len() > 1 {
      Some(parts[1..].join("/"))
    } else {
      None
    },
  )
}
