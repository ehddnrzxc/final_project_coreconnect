package com.goodee.coreconnect.board.dto.response;

import java.time.LocalDateTime;

import com.goodee.coreconnect.board.entity.BoardReply;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
/**
 * 댓글/대댓글 응답 DTO
 */
public class BoardReplyResponseDTO {

    private Integer id;              
    private String content;          
    private LocalDateTime createdAt; 
    private LocalDateTime updatedAt; 
    private Boolean deletedYn;       
    private String writerName; 
    private String writerEmail; 
    private Integer parentReplyId;    // 부모 댓글 ID (대댓글일 경우)
    private String writerJobGrade;

    /**
     * Entity -> DTO 변환
     */
    public static BoardReplyResponseDTO toDTO(BoardReply reply) {
        if (reply == null) return null;

        return BoardReplyResponseDTO.builder().id(reply.getId())
                                               .content(reply.getContent())
                                               .createdAt(reply.getCreatedAt())
                                               .updatedAt(reply.getUpdatedAt())
                                               .deletedYn(reply.getDeletedYn())
                                               .writerName(reply.getUser() != null ? reply.getUser().getName() : null)
                                               .writerEmail(reply.getUser() != null ? reply.getUser().getEmail() : null)
                                               .parentReplyId(reply.getParentReply() != null ? reply.getParentReply().getId() : null)
                                               .writerJobGrade(reply.getUser().getJobGrade() != null ? reply.getUser()
                                                                                                            .getJobGrade()
                                                                                                            .label() : null)
                                               .build();
    }
}
