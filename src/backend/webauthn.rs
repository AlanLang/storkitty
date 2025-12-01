use anyhow::Result;
use webauthn_rs::prelude::*;

pub fn init_webauthn() -> Result<Webauthn> {
  let rp_id = "localhost";
  let rp_origin = Url::parse("http://localhost:3000").expect("Invalid URL");
  let builder = WebauthnBuilder::new(rp_id, &rp_origin).expect("Invalid configuration");
  let webauthn = builder.build().expect("Invalid configuration");

  Ok(webauthn)
}
