package com.goodee.coreconnect.chat.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.goodee.coreconnect.chat.entity.Chat;

public interface ChatRepository extends JpaRepository<Chat, Integer> {

    // 채팅방의 모든 메시지
    List<Chat> findByChatRoomId(Integer id);

    // 여러 채팅방의 모든 메시지
    @Query("SELECT c FROM Chat c WHERE c.chatRoom.id IN :roomIds")
    List<Chat> findByChatRoomIds(@Param("roomIds") List<Integer> roomIds);

    // 채팅방의 모든 메시지(오름차순)
    List<Chat> findByChatRoomIdOrderBySendAtAsc(Integer roomId);

    // 채팅방의 안읽은 메시지(모든 참여자 기준)
    //List<Chat> findByChatRoom_IdAndReadYnIsFalse(Integer chatRoomId);

    // JPQL로 직접 작성 (추천)
    //@Query("SELECT c FROM Chat c WHERE c.chatRoom.id = :roomId AND c.readYn = false")
    //List<Chat> findUnreadChatsByRoomId(@Param("roomId") Integer roomId);

    //List<Chat> findByChatRoom_IdAndReadYnIsFalse(Integer chatRoomId);
    
    @Query("SELECT c FROM Chat c JOIN FETCH c.sender WHERE c.chatRoom.id = :roomId AND c.readYn = false")
    List<Chat> findByChatRoom_IdAndReadYnIsFalseWithSender(@Param("roomId") Integer chatRoomId);
    
    // 1. 내가 참여중인 채팅방들의 마지막 메시지만 조회
    @Query("SELECT c FROM Chat c WHERE c.chatRoom.id IN :roomIds AND c.sendAt = (SELECT MAX(c2.sendAt) FROM Chat c2 WHERE c2.chatRoom.id = c.chatRoom.id)")
    List<Chat> findLatestMessageByChatRoomIds(@Param("roomIds") List<Integer> roomIds);

    // 2. 채팅방 내에서 특정 메시지의 미읽은 인원 조회 (ChatMessageReadStatus 활용)
    @Query("SELECT r.chat.id, COUNT(r) FROM ChatMessageReadStatus r WHERE r.chat.chatRoom.id = :roomId AND r.readYn = false GROUP BY r.chat.id")
    List<Object[]> countUnreadByRoomId(@Param("roomId") Integer roomId);
    
    
    // 만약 사용자별 읽음 관리가 필요하다면 별도 테이블 및 Repository 필요
}