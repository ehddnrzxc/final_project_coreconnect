-- user_employee_number 컬럼 추가 (아직 컬럼이 없는 경우)
-- MySQL/MariaDB 버전

ALTER TABLE users 
ADD COLUMN user_employee_number VARCHAR(10) NULL 
AFTER user_profile_image_key;

-- UNIQUE 제약조건 추가
ALTER TABLE users 
ADD UNIQUE INDEX uk_user_employee_number (user_employee_number);

-- PostgreSQL 버전
/*
ALTER TABLE users 
ADD COLUMN user_employee_number VARCHAR(10) NULL;

CREATE UNIQUE INDEX uk_user_employee_number ON users(user_employee_number);
*/

-- H2 Database 버전
/*
ALTER TABLE users 
ADD COLUMN user_employee_number VARCHAR(10) NULL;

CREATE UNIQUE INDEX uk_user_employee_number ON users(user_employee_number);
*/

