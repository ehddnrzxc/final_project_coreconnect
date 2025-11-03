import React, {useState, useEffect} from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './ChatLayout.css';
import { fetchChatRoomsLatest } from '../api/ChatRoomApi';


function ChatLayout() {
 const [roomList, setRoomList] = useState([]);
 const [loading, setLoading] = useState(true);
 const [selectedRoomId, setSelectedRoomId] = useState(null);

 useEffect(() => {
    // 채팅방 목록을 마운트 시 DB에서 불러옴
    async function loadRooms() {
      try {
        setLoading(true);
        const res = await fetchChatRoomsLatest();
        if (res && res.status === 200 && Array.isArray(res.data)) {
          // sendAt 기준 내림차순 정렬
          const sortedRooms = [...res.data].sort((a, b) => 
            new Date(b.sendAt) - new Date(a.sendAt)
          )
          setRoomList(sortedRooms);
          setSelectedRoomId(sortedRooms[0]?.roomId ?? null); // 첫 번째 방 기본선택
        }
      } finally {
        setLoading(false);
      }
    }
    loadRooms();
  }, []);

  // 여기서 selectedRoom을 선언
  const selectedRoom = roomList.find(r => r.roomId === selectedRoomId);

  if (loading) {
    return <div>채팅방 목록 로딩중...</div>;
  }

  return (
    <div className="chat-layout">
      <ChatHeader />
      <div className="chat-content">
        <ChatSidebar />
        <div className="chat-main-2col">
          {/* 왼쪽: 채팅방 목록 */}
         {selectedRoom && (
        <section className="chat-list-col">
            <div className="chat-list-col-inner">
              <div className="chat-list-header">
                <span className="list-tab active">전체</span>
                <span className="list-tab">안읽음</span>
              </div>
              <ul className="chat-room-list">
                {roomList.map(room => (
                  <li
                    key={room.roomId}
                    className={
                      "chat-room-item" +
                      (selectedRoomId === room.roomId ? " active" : "")
                    }
                    onClick={() => setSelectedRoomId(room.roomId)}
                  >
                    {/* 원한다면 아바타, senderName 등 추가 가능 */}
                    <div className="room-info">
                      <div className="room-name-row">
                        <span className="room-name">{room.roomName}</span>
                        {/* 안읽은 메시지 수 */}
                        <span className="room-count">{room.unreadCount > 0 ? room.unreadCount : ''}</span>
                      </div>
                      <div className="room-preview-row">
                        {/* 마지막 메시지 내용 */}
                        <span className="room-preview">
                          {room.fileYn ? "[파일]" : room.messageContent || ""}
                        </span>
                        {/* 마지막 메시지 시간 (HH:mm) */}
                        <span className="room-time">
                          {room.sendAt ? new Date(room.sendAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
          {/* 오른쪽: 대화창 */}
          {/* <section className="chat-room-col">
            <div className="chat-room-col-inner">
              <div className="chat-room-top-bar">
                <img src={selectedRoom.avatar} className="room-avatar-lg" alt="방이미지" />
                <div className="room-name-lg">{selectedRoom.name}</div>
                <div className="room-top-icons">
                  <i className="fa-solid fa-phone" />
                  <i className="fa-solid fa-video" />
                  <i className="fa-solid fa-user-group" />
                  <i className="fa-solid fa-bars" />
                </div>
              </div>
              <div className="chat-room-msg-list">
                {(dummyMessages[selectedRoomId] || []).map((msg, idx) => (
                  <div className={"chat-msg " + (msg.my || msg.sender === "나" ? "my" : "other")} key={idx}>
                    {msg.sender !== "나" && <span className="msg-sender">{msg.sender}</span>}
                    <div className="msg-bubble">{msg.text}</div>
                    <span className="msg-time">{msg.time}</span>
                  </div>
                ))}
              </div>
              <form className="chat-room-inputbar" onSubmit={e=>e.preventDefault()}>
                <input className="msg-input" placeholder="메시지 입력" />
                <button className="msg-sendbtn"><i className="fa-regular fa-paper-plane" /></button>
                <div className="msg-input-icons">
                  <i className="fa-regular fa-image" />
                  <i className="fa-regular fa-face-smile" />
                  <i className="fa-solid fa-gift" />
                  <i className="fa-solid fa-gamepad" />
                </div>
              </form>
            </div>
          </section> */}
        </div>
      </div>
    </div>
  );
}

const ChatHeader = () => (
  <header className="chat-header">
    <div className="chat-header__left">
      <i className="fa-solid fa-comment-dots chat-header__mainicon" />
      <span className="chat-header__title">채팅</span>
    </div>
    <div className="chat-header__search">
      <input
        type="text"
        placeholder="메시지 검색"
        className="chat-header__searchinput"
      />
    </div>
    <div className="chat-header__actions">
      <i className="fa-regular fa-envelope" />
      <i className="fa-regular fa-bell" />
      <i className="fa-solid fa-circle-question" />
      <i className="fa-solid fa-user-circle" />
    </div>
  </header>
);

const ChatSidebar = () => (
  <aside className="chat-sidebar">
    <NavLink to="/chat/new" className="chat-sidebar__btn chat-sidebar__btn--main">
      <i className="fa-solid fa-plus" />
    </NavLink>
    <NavLink to="/chat/sort" className="chat-sidebar__btn">
      <i className="fa-solid fa-sort" />
    </NavLink>
    <NavLink to="/chat/notice" className="chat-sidebar__btn chat-sidebar__notice">
      <i className="fa-solid fa-bell" />
      <span className="chat-sidebar__badge">2</span>
    </NavLink>
    <NavLink to="/chat/pinned" className="chat-sidebar__btn chat-sidebar__pinned">
      <span className="chat-sidebar__initial">최</span>
    </NavLink>
  </aside>
);

export default ChatLayout;