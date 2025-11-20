-- email_title 컬럼을 VARCHAR(20)에서 TEXT로 변경
-- MySQL/MariaDB 버전

ALTER TABLE email 
MODIFY COLUMN email_title TEXT NOT NULL;

