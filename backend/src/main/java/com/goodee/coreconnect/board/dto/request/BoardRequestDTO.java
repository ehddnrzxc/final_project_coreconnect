package com.goodee.coreconnect.board.dto.request;

import com.goodee.coreconnect.board.entity.Board;
import com.goodee.coreconnect.board.entity.BoardCategory;
import com.goodee.coreconnect.user.entity.User;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
/**
 * 게시글 요청 DTO
 */
public class BoardRequestDTO {

    private Integer categoryId;  
    private String title;        
    private String content;      
    private Boolean noticeYn;    
    private Boolean privateYn;
    private Boolean pinned;

    /**
     * DTO -> Entity 변환
     * Service에서 user, category를 주입받아 생성
     */
    public Board toEntity(User user, BoardCategory category) {
        return Board.createBoard(user,
                                  category,
                                  this.title,
                                  this.content,
                                  this.noticeYn,
                                  this.privateYn,
                                  this.pinned);
    }
}