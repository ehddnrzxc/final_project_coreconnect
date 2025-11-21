# 커밋 메시지

## 주요 변경사항

### 1. 채팅방 안읽음 카운트 오류 수정
- 자신이 보낸 메시지에 대한 안읽음 카운트가 표시되지 않도록 수정
- UNREAD_COUNT_UPDATE 및 ROOM_UNREAD_COUNT_UPDATE 메시지 처리 시 발신자 여부 확인 로직 추가
- 채팅방 목록 업데이트 시 자신이 보낸 메시지는 unreadCount 유지, 메시지 내용/시간만 업데이트

### 2. 채팅방 목록 실시간 업데이트 개선
- 현재 접속 중인 채팅방에서 메시지를 보내거나 받을 때 채팅방 목록의 마지막 메시지가 실시간으로 업데이트되도록 수정
- 자신이 보낸 메시지 처리 시 setRoomList 호출 추가
- 다른 사람이 보낸 메시지 처리 시 setRoomList 호출 추가

### 3. 받은 메일함 메일 표시 문제 해결
- UserProfileContext 로드 확인 로직 추가
- userEmail이 없을 때 빈 배열 설정하여 UI에 반영
- API 호출 전후 상세 디버깅 로그 추가

### 4. MailSideBar 안읽은 메일/받은 메일함 표시 문제 해결
- useState import 추가로 에러 해결
- Badge 표시 조건 개선 (null 체크 추가)
- UserProfileContext 사용 방법 개선
- MailCountContext 디버깅 로그 추가

## 기술적 개선사항
- 프론트엔드와 백엔드의 읽음 상태 동기화 개선
- 실시간 메시지 업데이트 로직 개선
- 에러 처리 및 디버깅 로그 강화
- 코드 안정성 향상 (null 체크, 옵셔널 체이닝)

## 영향 범위
- 채팅 시스템: ChatLayout.jsx
- 메일 시스템: MailInboxPage.jsx, MailSideBar.jsx, MailSentBoxPage.jsx, MailFavoritePage.jsx

## 테스트 항목
- [x] 자신이 보낸 메시지에 대한 안읽음 카운트가 표시되지 않는지 확인
- [x] 현재 접속 중인 채팅방에서 메시지를 보내거나 받을 때 채팅방 목록이 업데이트되는지 확인
- [x] 받은 메일함에서 메일 목록이 정상적으로 표시되는지 확인
- [x] MailSideBar에서 안읽은 메일 개수가 정상적으로 표시되는지 확인

