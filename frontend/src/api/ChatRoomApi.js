// ChatRoomApi.js
import http from './http'; // http.js의 instance를 import

// 채팅방별 마지막 메시지 목록 가져오기
export async function fetchChatRoomsLatest() {
  // 실제 요청: GET /api/v1/chat/rooms/messages/latest
  const res = await http.get("/chat/rooms/messages/latest");
  return res.data;
}