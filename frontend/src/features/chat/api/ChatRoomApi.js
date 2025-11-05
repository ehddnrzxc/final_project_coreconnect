// ChatRoomApi.js
import http from '../../../api/http'; // http.js의 instance를 import

// 채팅방별 마지막 메시지 목록 가져오기
export async function fetchChatRoomsLatest() {
  // 실제 요청: GET /api/v1/chat/rooms/messages/latest
  const res = await http.get("/chat/rooms/messages/latest");
  return res.data;
}

// 채팅방별 전체 메시지 (roomId 기준)
export async function fetchChatRoomMessages(roomId) {
  const res = await http.get(`/chat/${roomId}/messages`);
  return res.data;
}

// 내가 참여중인 채팅방의 안읽은 메시지 개수/목록 조회
export async function fetchUnreadmessages() {
  // 실제 요청: GET /api/v1/chat/messages/unread
  const res = await http.get("/chat/messages/unread");
  return res.data;
}

// 채팅바에서 모든 메시지를 읽음처리 (PATCH)
export const markRoomMessagesAsRead = async (roomId, accessToken) => {
  // PATCH /api/v1/chat/rooms/{roomId}/messages/read
  const res = await http.patch(
    `/chat/rooms/${roomId}/messages/read`,
    null,
    {headers: {Authorization: `Bearer ${accessToken}`}}
  );
  return res.data;
}