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
 * 게시글 등록/수정 요청
 */
public class BoardRequestDTO {

    private Integer categoryId;   // 카테고리 ID
    private String title;         // 제목
    private String content;       // 내용
    private Boolean noticeYn;     // 공지글 여부
    private Boolean privateYn;    // 비공개 여부

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
