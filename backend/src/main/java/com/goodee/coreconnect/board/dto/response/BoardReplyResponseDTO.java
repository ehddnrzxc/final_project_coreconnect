package com.goodee.coreconnect.board.dto.response;

import java.time.LocalDateTime;

import com.goodee.coreconnect.board.entity.BoardReply;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardReplyResponseDTO {

    private Integer id;               // 댓글 ID
    private String content;           // 내용
    private LocalDateTime createdAt;  // 작성일
    private LocalDateTime updatedAt;  // 수정일
    private Boolean deletedYn;        // 삭제 여부
    private String writerName;        // 작성자 이름
    private Integer parentReplyId;    // 부모 댓글 ID (대댓글인 경우)

    /**
     * Entity -> DTO 변환
     */
    public static BoardReplyResponseDTO toDTO(BoardReply reply) {
        return BoardReplyResponseDTO.builder()
                                     .id(reply.getId())
                                     .content(reply.getContent())
                                     .createdAt(reply.getCreatedAt())
                                     .updatedAt(reply.getUpdatedAt())
                                     .deletedYn(reply.getDeletedYn())
                                     .writerName(reply.getUser() != null ? reply.getUser().getName() : null)
                                     .parentReplyId(reply.getParentReply() != null ? reply.getParentReply().getId() : null)
                                     .build();
    }
}
