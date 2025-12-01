use anyhow::Result;
use webauthn_rs::prelude::*;

pub fn init_webauthn() -> Result<Webauthn> {
  // 从环境变量读取配置，默认使用 localhost
  let rp_id = std::env::var("WEBAUTHN_RP_ID").unwrap_or_else(|_| "localhost".to_string());
  let rp_origin_str =
    std::env::var("WEBAUTHN_RP_ORIGIN").unwrap_or_else(|_| "http://localhost:3000".to_string());

  let rp_origin = Url::parse(&rp_origin_str).expect("Invalid WEBAUTHN_RP_ORIGIN URL");

  log::info!(
    "WebAuthn initialized with RP ID: {}, Origin: {}",
    rp_id,
    rp_origin
  );

  let builder = WebauthnBuilder::new(&rp_id, &rp_origin)
    .expect("Invalid WebAuthn configuration")
    .rp_name("StorKitty");

  let webauthn = builder.build().expect("Failed to build WebAuthn instance");

  Ok(webauthn)
}
