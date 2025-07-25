use bcrypt;

fn main() {
    let password = "admin123";
    let hash = bcrypt::hash(password, bcrypt::DEFAULT_COST).expect("Failed to hash password");
    println!("Password: {}", password);
    println!("Hash: {}", hash);
}