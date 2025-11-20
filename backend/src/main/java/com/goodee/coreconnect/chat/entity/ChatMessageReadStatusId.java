package com.goodee.coreconnect.chat.entity;

import java.io.Serializable;
import java.util.Objects;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * ChatMessageReadStatus의 복합키 클래스
 * (chat_id, user_id) 조합이 고유키
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ChatMessageReadStatusId implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private Integer chat; // Chat 엔티티의 id
    private Integer user; // User 엔티티의 id
}

