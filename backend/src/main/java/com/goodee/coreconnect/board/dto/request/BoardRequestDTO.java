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
 * 게시글 등록/수정 요청 DTO
 * - 게시글 작성 및 수정 시 클라이언트로부터 데이터 수신
 */
public class BoardRequestDTO {

    private Integer categoryId;  
    private String title;        
    private String content;      
    private Boolean noticeYn;    
    private Boolean privateYn;   

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
                                  this.privateYn);
    }
}