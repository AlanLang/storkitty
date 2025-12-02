use anyhow::Result;
use webauthn_rs::prelude::*;

pub fn init_webauthn() -> Result<Webauthn> {
  // 从环境变量中读取当前系统地址
  let origin = std::env::var("WEB_URL").unwrap_or_else(|_| "http://localhost:3000".to_string());
  let url = Url::parse(&origin).expect("Invalid URL");
  let rp_id = url.host_str().unwrap_or("localhost");
  let rp_origin = url.clone();

  log::info!(
    "WebAuthn initialized with RP ID: {}, Origin: {}",
    rp_id,
    rp_origin
  );

  let builder = WebauthnBuilder::new(rp_id, &rp_origin)
    .expect("Invalid WebAuthn configuration")
    .rp_name("StorKitty");

  let webauthn = builder.build().expect("Failed to build WebAuthn instance");

  Ok(webauthn)
}
