use std::time::SystemTime;

pub fn format_modified_time(time: SystemTime) -> String {
  let datetime = time
    .duration_since(SystemTime::UNIX_EPOCH)
    .unwrap_or_default()
    .as_secs();
  chrono::DateTime::from_timestamp(datetime as i64, 0)
    .unwrap_or_default()
    .with_timezone(&chrono::Local)
    .format("%Y-%m-%d %H:%M:%S")
    .to_string()
}
