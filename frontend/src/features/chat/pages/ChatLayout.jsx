import React, { useState, useEffect, useRef, useContext } from "react";

import { Box } from "@mui/material";
import ChatHeader from "../components/ChatHeader";
import ChatSidebar from "../components/ChatSidebar";
import ChatRoomListPane from "../components/ChatRoomListPane";
import ChatDetailPane from "../components/ChatDetailPane";
import ChatRoomCreateDialog from "../components/ChatRoomCreateDialog";
import ToastList from "../components/ToastList";
import { UserProfileContext } from "../../../App";

import {
  markRoomMessagesAsRead,
  fetchChatRoomMessages,
  fetchChatRoomsLatest,
  createChatRoom
} from "../api/ChatRoomApi";

import {
  connectStomp,
  disconnectStomp,
  sendStompMessage
} from "../api/chatSocket";

// ===================== 시간 및 유저명 유틸 함수 =====================
// 시간 포맷팅 유틸
function formatTime(sendAt) {
  if (!sendAt) return "";
  const d = new Date(sendAt);
  const today = new Date();
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (isToday) {
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  } else {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  }
}

// 유저이름 얻기 유틸
function getUserName() {
  try {
    const user = useContext(UserProfileContext);
    return user?.name || "";
  } catch {
    return "";
  }
}

export default function ChatLayout() {
  // ---------- 상태 변수 ----------
  const { userProfile } = useContext(UserProfileContext) || {};
  const [roomList, setRoomList] = useState([]); // 전체 채팅방 목록
  const [selectedRoomId, setSelectedRoomId] = useState(null); // 현재 선택된 방ID
  const [messages, setMessages] = useState([]); // 현재 방 메시지 목록
  const [tabIdx, setTabIdx] = useState(0); // 탭 인덱스
  const [toastRooms, setToastRooms] = useState([]); // 토스트 알림 Rooms
  const [createOpen, setCreateOpen] = useState(false); // 방 생성 다이얼로그 열림 여부

  const userName = getUserName(); // 유저명
  const accessToken = localStorage.getItem("accessToken"); // 엑세스토큰
  const inputRef = useRef(); // 입력창 관리 ref

  const [socketConnected, setSocketConnected] = useState(false); // 소켓 연결 상태
  
  // 페이징 관련 상태
  const [currentPage, setCurrentPage] = useState(0); // 현재 페이지 (0부터 시작)
  const [hasMore, setHasMore] = useState(true); // 더 불러올 메시지가 있는지
  const [isLoadingMore, setIsLoadingMore] = useState(false); // 이전 메시지 로딩 중인지
  const [totalPages, setTotalPages] = useState(0); // 전체 페이지 수
  
  // ⭐ 중복 메시지 방지: 최근 처리한 메시지 ID 추적 (동시 호출 방지)
  const processedMessageIdsRef = useRef(new Set());
  const processingMessageIdsRef = useRef(new Set()); // 현재 처리 중인 메시지 ID

  // ---------- 읽지 않은 채팅방 개수 계산 ----------
  const unreadRoomCount = Array.isArray(roomList)
    ? roomList.filter((room) => room && room.unreadCount > 0).length
    : 0;

  // 채팅방 목록 정렬 함수
  // 우선순위: 1) 최근 생성된 방 (5분 이내) 2) 최근 메시지 시간
  const sortRoomList = (rooms) => {
    const now = new Date().getTime();
    const FIVE_MINUTES = 5 * 60 * 1000; // 5분을 밀리초로
    
    return [...rooms].sort((a, b) => {
      // 1. 최근 생성된 방 우선 정렬 (5분 이내)
      const aCreatedAt = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreatedAt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const aIsRecent = aCreatedAt > 0 && (now - aCreatedAt) < FIVE_MINUTES;
      const bIsRecent = bCreatedAt > 0 && (now - bCreatedAt) < FIVE_MINUTES;
      
      if (aIsRecent && !bIsRecent) return -1; // a가 최근 생성
      if (!aIsRecent && bIsRecent) return 1;  // b가 최근 생성
      if (aIsRecent && bIsRecent) {
        // 둘 다 최근 생성이면 생성 시간 기준 내림차순
        return bCreatedAt - aCreatedAt;
      }
      
      // 2. 최근 메시지 시간 기준 정렬
      const timeA = a.lasMessageTime ? new Date(a.lasMessageTime).getTime() : 0;
      const timeB = b.lasMessageTime ? new Date(b.lasMessageTime).getTime() : 0;
      
      // 둘 다 메시지가 없으면 생성 시간 기준 (있는 경우만)
      if (timeA === 0 && timeB === 0) {
        if (aCreatedAt > 0 && bCreatedAt > 0) {
          return bCreatedAt - aCreatedAt;
        }
        return 0;
      }
      
      // 메시지 시간 기준 내림차순
      return timeB - timeA;
    });
  };

  // ---------- 채팅방 생성 ----------
  const handleCreateRoom = async (data) => {
    try {
      const res = await createChatRoom(data);
      // 백엔드 응답 구조: ResponseEntity<ChatRoomResponseDTO> (ResponseDTO로 감싸지 않음)
      // res.data가 바로 ChatRoomResponseDTO: { id, roomName, roomType, ... }
      const room = res?.data || res;
      // 백엔드 DTO는 id 필드를 사용하므로 roomId 대신 id 확인
      const roomId = room?.id || room?.roomId;
      if (!room || !roomId) {
        console.error("응답 데이터:", res);
        throw new Error("응답 데이터 없음");
      }
      // roomId 필드로 통일하여 추가 (다른 곳에서 roomId를 사용하므로)
      const now = new Date().toISOString();
      const roomWithRoomId = { 
        ...room, 
        roomId: roomId,
        roomName: room.roomName || room.roomName,
        unreadCount: 0,
        lastMessageContent: null,
        lasMessageTime: null,
        lastSenderName: null,
        createdAt: now // 생성 시간 추가 (최근 생성된 방을 맨 위에 표시하기 위해)
      };
      
      // 새로 생성된 방을 맨 위에 추가하고 정렬
      setRoomList(prev => {
        const updated = [roomWithRoomId, ...prev];
        return sortRoomList(updated);
      });
      
      setSelectedRoomId(roomId); // 방 생성시에만 바로 진입
      setCreateOpen(false);
      // 목록 새로고침하여 최신 상태 유지 (백엔드에서 받은 데이터로 동기화)
      setTimeout(() => loadRooms(), 500);
    } catch (error) {
      console.error("채팅방 생성 에러:", error);
      alert("채팅방 생성 에러: " + (error.message || "응답 데이터 없음"));
    }
  };

  // ---------- 새 메시지 도착 처리 (+ 토스트 알림) ----------
  const handleNewMessage = (msg) => {
    console.log("🔔 [ChatLayout] handleNewMessage 호출:", {
      msgType: msg.type,
      roomId: msg.roomId,
      selectedRoomId: selectedRoomId,
      senderName: msg.senderName,
      senderEmail: msg.senderEmail,
      messageContent: msg.messageContent,
      전체메시지: msg
    });
    
    // ⭐ unreadCount 업데이트 메시지 처리 (다른 참여자가 메시지를 읽었을 때)
    if (msg.type === "UNREAD_COUNT_UPDATE") {
      const { chatId, unreadCount, roomId, viewerId, viewerEmail } = msg;
      
      // ⭐ 디버깅: UNREAD_COUNT_UPDATE 메시지 수신 확인 (필요시 주석 해제)
      console.log("📊 [ChatLayout] UNREAD_COUNT_UPDATE 수신:", {
        chatId,
        unreadCount,
        roomId,
        selectedRoomId,
        viewerId,
        viewerEmail,
        메시지전체: msg
      });
      
      // ⭐ 현재 선택된 방의 메시지 목록에서 해당 메시지의 unreadCount 업데이트
      // (다른 참여자가 메시지를 읽었을 때 모든 참여자의 화면에서 unreadCount가 -1씩 감소)
      if (Number(roomId) === Number(selectedRoomId)) {
        setMessages((prev) => {
          // ⭐ 이전 상태에서 해당 메시지 찾기
          // ⭐ m.id가 숫자일 수 있으므로 안전하게 비교
          const targetMessage = prev.find(m => {
            const mId = m?.id;
            const chatIdNum = Number(chatId);
            if (mId == null) return false;
            // 숫자로 변환하여 비교 (문자열과 숫자 모두 처리)
            return Number(mId) === chatIdNum;
          });
          const previousUnreadCount = targetMessage?.unreadCount;
          
          const updated = prev.map((m) => {
            const mId = m?.id;
            const chatIdNum = Number(chatId);
            if (mId == null) return m;
            // 숫자로 변환하여 비교 (문자열과 숫자 모두 처리)
            return Number(mId) === chatIdNum
              ? { ...m, unreadCount: unreadCount != null ? unreadCount : 0 }
              : m;
          });
          
          // ⭐ 디버깅: 업데이트된 메시지 확인 (필요시 주석 해제)
          console.log("📊 [ChatLayout] unreadCount 업데이트 완료:", {
            chatId,
            이전unreadCount: previousUnreadCount,
            새로운unreadCount: unreadCount,
            업데이트된메시지: updated.find(m => Number(m.id) === Number(chatId)),
            전체메시지수: updated.length
          });
          
          return updated;
        });
      } else {
        // ⭐ 다른 방의 메시지인 경우 로그만 출력
        console.log("📊 [ChatLayout] UNREAD_COUNT_UPDATE 수신 (다른 방):", {
          chatId,
          unreadCount,
          roomId,
          selectedRoomId
        });
      }
      
      return;
    }
    
    // senderEmail로 내 메시지 판단 (백엔드에서 senderEmail 포함)
    // 대소문자/공백 차이를 방지하기 위해 trim().toLowerCase() 적용
    const isMyMessage = 
      msg.senderEmail && 
      userProfile?.email && 
      msg.senderEmail.trim().toLowerCase() === userProfile.email.trim().toLowerCase();
    
    if (isMyMessage) {
      console.log("🔥 [ChatLayout] 내 메시지로 판단됨:", {
        msgRoomId: msg.roomId,
        selectedRoomId: selectedRoomId,
        msgId: msg.id,
        senderEmail: msg.senderEmail,
        userEmail: userProfile?.email
      });
      
      if (Number(msg.roomId) === Number(selectedRoomId)) {
        console.log("🔥 [ChatLayout] 현재 방의 내 메시지 - messages state에 추가 시작");
        
        // ⭐ 즉시 중복 체크: 동시 호출 방지를 위해 ref 사용
        const msgId = msg?.id;
        if (msgId == null) {
          console.warn("📨 [ChatLayout] 메시지 ID가 없어 무시:", msg);
          return;
        }
        
        const numMsgId = Number(msgId);
        
        // ⭐ 이미 처리 중이거나 처리된 메시지인지 확인
        if (processingMessageIdsRef.current.has(numMsgId) || processedMessageIdsRef.current.has(numMsgId)) {
          console.log("📨 [ChatLayout] 중복 메시지 무시 (내 메시지, ref 체크):", {
            messageId: msgId,
            messageContent: msg.messageContent,
            처리중: processingMessageIdsRef.current.has(numMsgId),
            처리완료: processedMessageIdsRef.current.has(numMsgId)
          });
          return;
        }
        
        // ⭐ 처리 중 표시
        processingMessageIdsRef.current.add(numMsgId);
        
        // ⭐ 내가 보낸 새 메시지의 unreadCount가 있으면 그대로 사용 (백엔드에서 실시간 계산된 값)
        // unreadCount가 없거나 undefined인 경우 0으로 설정
        const newMessage = {
          ...msg,
          unreadCount: msg.unreadCount != null ? msg.unreadCount : 0
        };
        
        console.log("🔥 [ChatLayout] 새 메시지 객체 생성:", {
          id: newMessage.id,
          roomId: newMessage.roomId,
          messageContent: newMessage.messageContent,
          unreadCount: newMessage.unreadCount,
          전체메시지: newMessage
        });
        
        setMessages((prev) => {
          console.log("🔥 [ChatLayout] setMessages 호출 - 이전 메시지 수:", prev.length);
          
          // ⭐ 이중 체크: ref와 state 모두 확인
          const existsInState = prev.some(m => {
            const mId = m?.id;
            if (mId == null) return false;
            return Number(mId) === numMsgId;
          });
          
          if (existsInState) {
            console.log("📨 [ChatLayout] 중복 메시지 무시 (내 메시지, state 체크):", {
              messageId: msgId,
              messageContent: msg.messageContent
            });
            processingMessageIdsRef.current.delete(numMsgId);
            return prev;
          }
          
          // ⭐ 처리 완료 표시: processing에서 제거하고 processed에 추가
          processingMessageIdsRef.current.delete(numMsgId);
          processedMessageIdsRef.current.add(numMsgId);
          
          // ⭐ 최근 처리한 메시지 ID는 최대 1000개만 유지 (메모리 관리)
          if (processedMessageIdsRef.current.size > 1000) {
            const idsArray = Array.from(processedMessageIdsRef.current);
            processedMessageIdsRef.current = new Set(idsArray.slice(-500));
          }
          
          const updated = [...prev, newMessage];
          console.log("📨 [ChatLayout] 내가 보낸 메시지 추가 완료:", {
            messageId: msg.id,
            unreadCount: newMessage.unreadCount,
            전체메시지수: updated.length
          });
          return updated;
        });
      }
      return;
    }
    const roomIdNum = Number(msg.roomId);
    const foundRoom = Array.isArray(roomList) 
      ? roomList.find(r => r && Number(r.roomId) === roomIdNum)
      : null;

    // ⭐ 현재 선택된 방의 메시지인 경우, foundRoom이 없어도 메시지 추가
    // (roomList가 아직 로드되지 않았거나 업데이트되지 않은 경우에도 메시지 수신 가능)
    if (roomIdNum === Number(selectedRoomId)) {
      // ⭐ 즉시 중복 체크: 동시 호출 방지를 위해 ref 사용
      const msgId = msg?.id;
      if (msgId == null) {
        console.warn("📨 [ChatLayout] 메시지 ID가 없어 무시:", msg);
        return;
      }
      
      const numMsgId = Number(msgId);
      
      // ⭐ 이미 처리 중이거나 처리된 메시지인지 확인
      if (processingMessageIdsRef.current.has(numMsgId) || processedMessageIdsRef.current.has(numMsgId)) {
        console.log("📨 [ChatLayout] 중복 메시지 무시 (ref 체크):", {
          messageId: msgId,
          messageContent: msg.messageContent,
          처리중: processingMessageIdsRef.current.has(numMsgId),
          처리완료: processedMessageIdsRef.current.has(numMsgId)
        });
        return;
      }
      
      // ⭐ 처리 중 표시
      processingMessageIdsRef.current.add(numMsgId);
      
      // ⭐ 다른 사람이 보낸 새 메시지의 unreadCount가 있으면 그대로 사용 (백엔드에서 실시간 계산된 값)
      // unreadCount가 없거나 undefined인 경우 0으로 설정
      const newMessage = {
        ...msg,
        unreadCount: msg.unreadCount != null ? msg.unreadCount : 0
      };
      
      // ⭐ 디버깅: 다른 사람이 보낸 메시지의 unreadCount 확인 (필요시 주석 해제)
      console.log("📨 [ChatLayout] 다른 사람이 보낸 메시지 수신:", {
        messageId: msg.id,
        senderName: msg.senderName,
        senderEmail: msg.senderEmail,
        unreadCount: newMessage.unreadCount,
        messageContent: msg.messageContent,
        메시지전체: newMessage
      });
      
      setMessages((prev) => {
        // ⭐ 이중 체크: ref와 state 모두 확인
        const existsInState = prev.some(m => {
          const mId = m?.id;
          if (mId == null) return false;
          return Number(mId) === numMsgId;
        });
        
        if (existsInState) {
          console.log("📨 [ChatLayout] 중복 메시지 무시 (state 체크):", {
            messageId: msgId,
            messageContent: msg.messageContent
          });
          processingMessageIdsRef.current.delete(numMsgId);
          return prev;
        }
        
          // ⭐ 처리 완료 표시: processing에서 제거하고 processed에 추가
          processingMessageIdsRef.current.delete(numMsgId);
          processedMessageIdsRef.current.add(numMsgId);
          
          // ⭐ 최근 처리한 메시지 ID는 최대 1000개만 유지 (메모리 관리)
          if (processedMessageIdsRef.current.size > 1000) {
            const idsArray = Array.from(processedMessageIdsRef.current);
            processedMessageIdsRef.current = new Set(idsArray.slice(-500));
          }
          
          const updated = [...prev, newMessage];
          console.log("📨 [ChatLayout] 다른 사람이 보낸 메시지 추가 완료:", {
            messageId: msg.id,
            unreadCount: newMessage.unreadCount,
            전체메시지수: updated.length
          });
          return updated;
      });
    } else { // 다른 방이면 토스트 알림
      // ⭐ foundRoom이 없으면 토스트 알림을 생성하지 않음 (roomList에 방이 없을 수 있음)
      if (foundRoom) {
        setToastRooms((prev) => {
          const filtered = prev.filter(r => Number(r.roomId) !== roomIdNum);
          const newToast = {
            roomId: msg.roomId,
            unreadCount: msg.unreadCount || 1,
            lastUnreadMessageContent: msg.messageContent,
            lastUnreadMessageSenderName: msg.senderName,
            lastUnreadMessageTime: msg.sendAt,
            roomName: foundRoom.roomName
          };
          return [...filtered, newToast].sort(
            (a, b) => new Date(b.lastUnreadMessageTime) - new Date(a.lastUnreadMessageTime)
          );
        });
      }
    }
    // roomList의 해당 방 정보를 최신화하고 정렬
    setRoomList((prevRoomList) => {
      const updated = prevRoomList.map(room => Number(room.roomId) === roomIdNum
        ? {
          ...room,
          lastMessageContent: msg.messageContent,
          lasMessageTime: msg.sendAt,
          fileYn: msg.fileYn,
          sendAt: msg.sendAt,
          unreadCount: msg.unreadCount,
        }
        : room
      );
      return sortRoomList(updated);
    });
  };

  // ---------- 파일 업로드 ----------
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedRoomId) return;
    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`/api/v1/chat/${selectedRoomId}/messages/file`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData
      });
      if (!res.ok) throw new Error("파일 업로드 실패");
      const result = await res.json();
      const chatMessage = result.data;
      
      // ⭐ 중복 메시지 체크: 이미 같은 ID의 메시지가 있으면 추가하지 않음
      setMessages((prev) => {
        const exists = prev.some(m => {
          const mId = m?.id;
          const newId = chatMessage?.id;
          if (mId == null || newId == null) return false;
          return Number(mId) === Number(newId);
        });
        if (exists) {
          console.log("📨 [ChatLayout] 중복 메시지 무시 (파일 업로드):", {
            messageId: chatMessage.id,
            messageContent: chatMessage.messageContent
          });
          return prev;
        }
        return [...prev, chatMessage];
      });
    } catch (err) {
      alert("파일 업로드에 실패했습니다: " + err.message);
    }
    e.target.value = "";
  };

  // ---------- 메시지 보내기 ----------
  const handleSend = () => {
    const message = inputRef.current.value;
    if (!message.trim()) {
      return;
    }
    
    if (!socketConnected) {
      alert("채팅 서버와 연결되어 있지 않습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    // ⭐ WebSocket을 통해 메시지 전송 (서버에서 브로드캐스트된 메시지를 수신하여 표시)
    // ⭐ 재연결이 필요한 경우를 대비해 콜백 전달
    sendStompMessage(
      { roomId: selectedRoomId, content: message },
      {
        onMessage: msg => handleNewMessage(msg),
        onConnect: () => {
          console.log('🔥 [ChatLayout] 재연결 성공 - socketConnected를 true로 설정');
          setSocketConnected(true);
        },
        onError: () => {
          console.log('🔥 [ChatLayout] 재연결 실패 - socketConnected를 false로 설정');
          setSocketConnected(false);
        }
      }
    ).then((success) => {
      if (success) {
        inputRef.current.value = "";
      } else {
        // ⭐ 연결이 안 되어 있으면 재연결 시도 후 다시 전송 시도
        if (!socketConnected) {
          console.warn('🔥 [ChatLayout] 연결이 끊어져 재연결 시도 중...');
          // 재연결은 connectStomp가 useEffect에서 처리됨
          alert("채팅 서버와 연결되어 있지 않습니다. 잠시 후 다시 시도해 주세요.");
        } else {
          alert("메시지 전송에 실패했습니다. 연결 상태를 확인해주세요.");
        }
      }
    }).catch((error) => {
      console.error('🔥 [ChatLayout] 메시지 전송 중 예외 발생:', error);
      alert("메시지 전송 중 오류가 발생했습니다.");
    });
  };

  // ---------- 스크롤로 읽음 처리 ----------
  const handleScrollRead = async () => {
    if (selectedRoomId && messages.length > 0) {
      await markRoomMessagesAsRead(selectedRoomId);
      loadRooms();
    }
  };

  // ---------- 채팅방 목록 새로고침 (최신화) ----------
  // 이 함수에서 방 목록을 받아와도 setSelectedRoomId(null)로 설정하여
  // 첫 진입시 아무 방도 선택하지 않게 한다
  const loadRooms = async () => {
    const res = await fetchChatRoomsLatest();
    if (res && Array.isArray(res.data)) {
      // 정렬 함수 사용
      const sortedRooms = sortRoomList(res.data);
      setRoomList(sortedRooms);
      setSelectedRoomId(null); // ★ 첫 진입시 아무 방도 자동 선택 안 함
    } else {
      setRoomList([]);
      setSelectedRoomId(null);
    }
  };

  // ---------- 채팅방 목록 최초 로드 ----------
  useEffect(() => {
    loadRooms();
  }, []);

  // ---------- 채팅방 선택시 메시지 로딩 (최신 메시지부터) ----------
  useEffect(() => {
    async function loadMessages() {
      if (selectedRoomId) {
        // 채팅방이 변경되면 페이징 상태 초기화
        setCurrentPage(0);
        setHasMore(true);
        setIsLoadingMore(false);
        
        const res = await fetchChatRoomMessages(selectedRoomId, 0, 20);
        if (res && res.data) {
          // ResponseDTO 구조: { status, message, data: Page<ChatMessageResponseDTO> }
          const pageData = res.data.data || res.data; // res.data.data가 Page 객체
          if (pageData && Array.isArray(pageData.content)) {
            // 최신 메시지부터 내림차순으로 받아오므로 역순으로 정렬하여 오름차순으로 표시
            const sortedMessages = [...pageData.content].reverse();
            
            // ⭐ 디버깅: 메시지 수신 시 프로필 이미지 URL 확인 (개발 중 확인용)
            // console.log("📨 [ChatLayout] 메시지 로드 완료:", {
            //   메시지수: sortedMessages.length,
            //   첫번째메시지: sortedMessages[0],
            //   프로필이미지URL들: sortedMessages.map(m => ({
            //     senderName: m.senderName,
            //     senderEmail: m.senderEmail,
            //     senderProfileImageUrl: m.senderProfileImageUrl,
            //     profileImageUrl길이: m.senderProfileImageUrl?.length || 0
            //   }))
            // });
            
            setMessages(sortedMessages);
            setTotalPages(pageData.totalPages || 0);
            setHasMore(!pageData.last); // last가 false면 더 있음
            setCurrentPage(0);
            
          // ⭐ 채팅방 접속 시 안읽은 메시지들을 읽음 처리
          // 이렇게 하면 내가 읽은 메시지들의 unreadCount가 -1씩 감소됨
          try {
            await markRoomMessagesAsRead(selectedRoomId);
            console.log("[ChatLayout] 채팅방 접속 시 메시지 읽음 처리 완료 - roomId:", selectedRoomId);
          } catch (error) {
            console.error("[ChatLayout] 메시지 읽음 처리 실패:", error);
          }
          
          // ⭐ 채팅방 변경 시 처리된 메시지 ID 초기화 (새 방의 메시지 로드)
          processedMessageIdsRef.current.clear();
          processingMessageIdsRef.current.clear();
          } else if (Array.isArray(pageData)) {
            // 기존 형식 (배열) 지원
            setMessages(pageData);
            setHasMore(false);
            
            // ⭐ 채팅방 접속 시 안읽은 메시지들을 읽음 처리
            try {
              await markRoomMessagesAsRead(selectedRoomId);
              console.log("[ChatLayout] 채팅방 접속 시 메시지 읽음 처리 완료 - roomId:", selectedRoomId);
            } catch (error) {
              console.error("[ChatLayout] 메시지 읽음 처리 실패:", error);
            }
            
            // ⭐ 채팅방 변경 시 처리된 메시지 ID 초기화 (새 방의 메시지 로드)
            processedMessageIdsRef.current.clear();
            processingMessageIdsRef.current.clear();
          } else {
            setMessages([]);
            setHasMore(false);
            // ⭐ 메시지가 없을 때도 초기화
            processedMessageIdsRef.current.clear();
            processingMessageIdsRef.current.clear();
          }
        } else {
          setMessages([]);
          setHasMore(false);
          processedMessageIdsRef.current.clear();
          processingMessageIdsRef.current.clear();
        }
      } else {
        setMessages([]);
        setHasMore(false);
        processedMessageIdsRef.current.clear();
        processingMessageIdsRef.current.clear();
      }
    }
    loadMessages();
  }, [selectedRoomId]);
  
  // ---------- 이전 메시지 로딩 (무한 스크롤) ----------
  const handleLoadMoreMessages = async () => {
    if (!selectedRoomId || isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const res = await fetchChatRoomMessages(selectedRoomId, nextPage, 20);
      
      if (res && res.data) {
        // ResponseDTO 구조: { status, message, data: Page<ChatMessageResponseDTO> }
        const pageData = res.data.data || res.data; // res.data.data가 Page 객체
        if (pageData && Array.isArray(pageData.content)) {
          // 이전 메시지를 앞에 추가 (오름차순 유지)
          // pageData.content는 내림차순이므로 역순으로 정렬
          const newMessages = [...pageData.content].reverse();
          
          // ⭐ 중복 메시지 체크: 이미 존재하는 메시지는 제외
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => {
              const mId = m?.id;
              return mId != null ? Number(mId) : null;
            }).filter(id => id != null));
            
            const filteredNewMessages = newMessages.filter(msg => {
              const msgId = msg?.id;
              if (msgId == null) return false;
              const numId = Number(msgId);
              return !existingIds.has(numId);
            });
            
            if (filteredNewMessages.length < newMessages.length) {
              console.log("📨 [ChatLayout] 중복 메시지 제외 (이전 메시지 로딩):", {
                전체메시지수: newMessages.length,
                중복제외후: filteredNewMessages.length,
                제외된메시지수: newMessages.length - filteredNewMessages.length
              });
            }
            
            return [...filteredNewMessages, ...prev];
          });
          setTotalPages(pageData.totalPages || 0);
          setHasMore(!pageData.last);
          setCurrentPage(nextPage);
        }
      }
    } catch (error) {
      console.error("이전 메시지 로딩 실패:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // ---------- STOMP 기반 채팅방 소켓 연결관리 ----------
  useEffect(() => {
    console.log('🔥 [ChatLayout] useEffect 실행 - selectedRoomId:', selectedRoomId);
    
    if (!selectedRoomId) {
      console.log('🔥 [ChatLayout] selectedRoomId가 없어 연결하지 않음');
      // ⭐ selectedRoomId가 없으면 기존 연결 해제
      setSocketConnected(false);
      disconnectStomp();
      return;
    }

    console.log('🔥 [ChatLayout] connectStomp 호출 시작 - roomId:', selectedRoomId);
    
    // ⭐ 중복 구독 방지: 기존 연결 해제 후 새로 연결
    disconnectStomp();
    
    connectStomp(
      selectedRoomId,
      msg => {
        // ⭐ 중복 메시지 수신 방지: handleNewMessage에서 이미 중복 체크를 하지만
        // WebSocket 구독이 중복되면 같은 메시지가 여러 번 수신될 수 있으므로
        // 여기서도 추가 로그를 남겨 디버깅 가능하도록 함
        console.log('🔥 [ChatLayout] WebSocket 메시지 수신:', {
          messageId: msg?.id,
          roomId: msg?.roomId,
          selectedRoomId: selectedRoomId
        });
        handleNewMessage(msg);
      },
      () => {
        console.log('🔥 [ChatLayout] 연결 성공 콜백 - socketConnected를 true로 설정');
        setSocketConnected(true);
      },
      () => {
        console.log('🔥 [ChatLayout] 연결 에러 콜백 - socketConnected를 false로 설정');
        setSocketConnected(false);
      }
    );

    return () => {
      console.log("🔥 [ChatLayout] 채팅방 나가기 - 소켓 연결 해제");
      setSocketConnected(false);
      disconnectStomp();
    };
  }, [selectedRoomId]);

  // ---------- 메시지 박스 끝으로 스크롤 ----------
  const messagesEndRef = useRef(null);
  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // ⭐ 디버깅: messages 상태 변경 추적 (필요시 주석 해제)
  useEffect(() => {
    console.log("📋 [ChatLayout] messages 상태 변경:", {
      메시지수: messages.length,
      unreadCount포함메시지: messages.filter(m => m.unreadCount != null && m.unreadCount > 0).map(m => ({
        id: m.id,
        unreadCount: m.unreadCount,
        senderName: m.senderName
      })),
      전체메시지unreadCount: messages.map(m => ({ id: m.id, unreadCount: m.unreadCount }))
    });
  }, [messages]);

  // ---------- 읽지 않은 메시지 계산 및 첫 unread 인덱스 ----------
  const unreadCount = messages.reduce((cnt, msg) => cnt + (msg.readYn === false ? 1 : 0), 0);
  const firstUnreadIdx = unreadCount > 0 ? messages.findIndex(msg => msg.readYn === false) : -1;

  // ---------- 렌더링 ----------
  return (
    <Box className="chat-layout" sx={{
      background: "#fafbfc", minHeight: "100vh",
      display: "flex", flexDirection: "row"
    }}>
      {/* 우측 하단 토스트 알림 */}
      <ToastList rooms={toastRooms} formatTime={formatTime} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} />
      {/* 왼쪽 사이드바 + 방 생성 */}
      <ChatSidebar unreadRoomCount={unreadRoomCount} onCreateRoom={() => setCreateOpen(true)} />
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", background: "#fafbfc" }}>
        <ChatHeader />
        <Box sx={{
          flex: 1, display: "flex", flexDirection: "row",
          px: 5, pt: 2, gap: 2, minHeight: 0
        }}>
          <ChatRoomListPane
            tabIdx={tabIdx}
            setTabIdx={setTabIdx}
            roomList={roomList}
            selectedRoomId={selectedRoomId}
            setSelectedRoomId={setSelectedRoomId}
            unreadRoomCount={unreadRoomCount}
            formatTime={formatTime}
          />
          <ChatDetailPane
            selectedRoom={Array.isArray(roomList)
              ? roomList.find(r => r && r.roomId === selectedRoomId) : null}
            messages={messages}
            unreadCount={unreadCount}
            firstUnreadIdx={firstUnreadIdx}
            formatTime={formatTime}
            inputRef={inputRef}
            onSend={handleSend}
            onFileUpload={handleFileUpload}
            socketConnected={socketConnected}
            onScrollTop={handleLoadMoreMessages}
            isLoadingMore={isLoadingMore}
            hasMoreAbove={hasMore}
          />
        </Box>
      </Box>
      {/* 채팅방 생성 다이얼로그 */}
      <ChatRoomCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreateRoom} />
    </Box>
  );
}