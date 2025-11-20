package com.goodee.coreconnect.chat.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.goodee.coreconnect.chat.entity.Chat;


public interface ChatRepository extends JpaRepository<Chat, Integer> {

    // 1. 채팅방의 모든 메시지
    List<Chat> findByChatRoomId(Integer id);

    // 2. 여러 채팅방의 모든 메시지
    @Query("SELECT c FROM Chat c WHERE c.chatRoom.id IN :roomIds")
    List<Chat> findByChatRoomIds(@Param("roomIds") List<Integer> roomIds);

    // 3. 채팅방의 모든 메시지(오름차순)
    List<Chat> findByChatRoomIdOrderBySendAtAsc(Integer roomId);

    // 채팅방의 안읽은 메시지(모든 참여자 기준)
    //List<Chat> findByChatRoom_IdAndReadYnIsFalse(Integer chatRoomId);

    // JPQL로 직접 작성 (추천)
    //@Query("SELECT c FROM Chat c WHERE c.chatRoom.id = :roomId AND c.readYn = false")
    //List<Chat> findUnreadChatsByRoomId(@Param("roomId") Integer roomId);

    //List<Chat> findByChatRoom_IdAndReadYnIsFalse(Integer chatRoomId);
    
    // 4. 특정 채팅방에서 아직 읽지 않은 채팅 메시지 들을 메시지의 발신자 정보까지 즉시로딩해서 리스트로 반환
    @Query("SELECT c FROM Chat c JOIN FETCH c.sender WHERE c.chatRoom.id = :roomId AND c.readYn = false")
    List<Chat> findByChatRoom_IdAndReadYnIsFalseWithSender(@Param("roomId") Integer chatRoomId);
    
    // 5. 내가 참여중인 채팅방들의 마지막 메시지만 조회
    @Query("SELECT c FROM Chat c WHERE c.chatRoom.id IN :roomIds AND c.sendAt = (SELECT MAX(c2.sendAt) FROM Chat c2 WHERE c2.chatRoom.id = c.chatRoom.id)")
    List<Chat> findLatestMessageByChatRoomIds(@Param("roomIds") List<Integer> roomIds);

    // 6. 채팅방 내에서 특정 메시지의 미읽은 인원 조회 (ChatMessageReadStatus 활용)
    @Query("SELECT r.chat.id, COUNT(r) FROM ChatMessageReadStatus r WHERE r.chat.chatRoom.id = :roomId AND r.readYn = false GROUP BY r.chat.id")
    List<Object[]> countUnreadByRoomId(@Param("roomId") Integer roomId);
    
    // 7. 각 채팅방의 가장 마지막(최신) 메시지
    @Query("SELECT c FROM Chat c WHERE c.chatRoom.id IN :roomIds AND c.sendAt = (SELECT MAX(c2.sendAt) FROM Chat c2 WHERE c2.chatRoom.id = c.chatRoom.id)")
    List<Chat> findLatestMessagesByRoomIds(@Param("roomIds") List<Integer> roomIds);
    
    
    // 8. 채팅방에서 메시지를 불러올때 파일이 있는 경우 파일들도 함께 조회
    @Query("SELECT DISTINCT c FROM Chat c " + 
    	   "LEFT JOIN FETCH c.messageFiles " + 
    		"WHERE c.chatRoom.id = :roomId " + 
    	   "ORDER BY c.sendAt ASC")
    List<Chat> findAllChatsWithFilesByRoomId(@Param("roomId") Integer roomId);
    
    // 8-1. 채팅방에서 메시지를 페이징으로 불러올때 파일이 있는 경우 파일들도 함께 조회 (최신 메시지부터)
    @Query("SELECT DISTINCT c FROM Chat c " + 
    	   "LEFT JOIN FETCH c.messageFiles " + 
    		"WHERE c.chatRoom.id = :roomId " + 
    	   "ORDER BY c.sendAt DESC")
    Page<Chat> findChatsWithFilesByRoomIdPaged(@Param("roomId") Integer roomId, Pageable pageable);
    

    /** 
     * 특정 채팅방에서 가장 최근(최신) 1개의 메시지를 반환
     * 최근 메시지가 없다면 null을 리턴합니다.
     */
    @Query("SELECT c FROM Chat c WHERE c.chatRoom.id = :roomId ORDER BY c.sendAt DESC")
    List<Chat> findTopByChatRoomIdOrderBySendAtDesc(@Param("roomId") Integer roomId);

    /**  
     * 단건 반환을 원할 경우 default 메서드 추가 (최신 메시지 1개)
     */
    default Chat findLatestMessageByRoomId(Integer roomId) {
        List<Chat> result = this.findTopByChatRoomIdOrderBySendAtDesc(roomId);
        return (result != null && !result.isEmpty()) ? result.get(0) : null;
    }
    
    
    // 10. 채팅방 목록 불러올 때 unreadcount 필드 채워서 DTO로 변환
    @Query("SELECT c.chat.chatRoom.id AS roomId, COUNT(c) AS unreadCount FROM ChatMessageReadStatus c WHERE c.user.id = :userId AND c.readYn = false GROUP BY c.chat.chatRoom.id")
    List<Object[]> countUnreadMessagesByUserId(@Param("userId") Integer userId);
}