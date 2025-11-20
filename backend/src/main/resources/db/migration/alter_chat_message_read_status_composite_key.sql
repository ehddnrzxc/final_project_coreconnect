-- ⭐ chat_message_read_status 테이블을 복합키 (chat_id, user_id)로 변경
-- 이렇게 하면 하나의 메시지에 대해 여러 참여자가 각각의 읽음 상태를 가질 수 있음

-- 1. 기존 PK 제거 (id 컬럼이 PK인 경우)
ALTER TABLE chat_message_read_status DROP PRIMARY KEY;

-- 2. id 컬럼 제거 (선택사항 - 복합키만 사용할 경우)
-- ALTER TABLE chat_message_read_status DROP COLUMN id;

-- 3. 복합키 (chat_message_id, user_id) 추가
ALTER TABLE chat_message_read_status 
ADD PRIMARY KEY (chat_message_id, user_id);

-- 4. (선택사항) id 컬럼을 유지하면서 복합키만 추가하려면:
-- ALTER TABLE chat_message_read_status 
-- ADD CONSTRAINT uk_chat_message_read_status_chat_user 
-- UNIQUE (chat_message_id, user_id);

