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
 * 댓글 및 대댓글 등록 요청 DTO
 * - 게시글 ID와 부모 댓글 ID를 포함하여 댓글 등록 요청을 처리
 */
public class BoardReplyRequestDTO {

    private Integer boardId;       
    private Integer parentReplyId; // 부모 댓글 ID (대댓글일 경우)
    private String content;        

    /**
     * DTO -> Entity 변환
     * Service 계층에서 user, board, parentReply를 주입받아 변환
     */
    public BoardReply toEntity(User user, Board board, BoardReply parentReply) {
        return BoardReply.createReply(user,
                                       board,
                                       parentReply,
                                       this.content);
    }
}
