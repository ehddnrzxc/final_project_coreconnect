-- create_user_profiles_table.sql
-- user_profiles 테이블 생성

CREATE TABLE IF NOT EXISTS user_profiles (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    company_name VARCHAR(100),
    direct_phone VARCHAR(20),
    fax VARCHAR(20),
    address VARCHAR(500),
    birthday DATE,
    bio TEXT,
    external_email VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

