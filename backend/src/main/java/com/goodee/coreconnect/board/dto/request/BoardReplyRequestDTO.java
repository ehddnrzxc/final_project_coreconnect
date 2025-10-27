package com.goodee.coreconnect.board.dto.request;

import com.goodee.coreconnect.board.entity.Board;
import com.goodee.coreconnect.board.entity.BoardReply;
import com.goodee.coreconnect.user.entity.User;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
/**
 * 댓글/대댓글 등록 요청
 */
public class BoardReplyRequestDTO {

    private Integer boardId;       // 게시글 ID
    private Integer parentReplyId; // 부모 댓글 ID (대댓글일 경우)
    private String content;        // 댓글 내용

    /**
     * DTO -> Entity 변환
     */
    public BoardReply toEntity(User user, Board board, BoardReply parentReply) {
        return BoardReply.createReply(user,
                                       board,
                                       parentReply,
                                       this.content);
    }
}
