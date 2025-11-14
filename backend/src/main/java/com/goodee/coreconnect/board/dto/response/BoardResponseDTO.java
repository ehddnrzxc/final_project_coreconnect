package com.goodee.coreconnect.board.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import com.goodee.coreconnect.board.entity.Board;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
/**
 * 게시글 응답 DTO
 */
public class BoardResponseDTO {

    private Integer id;                
    private String title;              
    private String content;            
    private Boolean noticeYn;        
    private Boolean pinned;
    private Boolean privateYn;         
    private Integer viewCount;         
    private LocalDateTime createdAt;   
    private LocalDateTime updatedAt;   
    private Boolean deletedYn;         
    private String writerName;
    private String writerEmail;
    private String categoryName;       
    private Integer replyCount;
    private Boolean hasImage;

    private List<BoardFileResponseDTO> files;    
    private List<BoardReplyResponseDTO> replies; 


    /**
     * Entity -> DTO 변환
     */
    public static BoardResponseDTO toDTO(Board board) {
        if (board == null) return null;

        return BoardResponseDTO.builder().id(board.getId())
                                          .title(board.getTitle())
                                          .content(board.getContent())
                                          .noticeYn(board.getNoticeYn())
                                          .pinned(board.getPinned())
                                          .privateYn(board.getPrivateYn())
                                          .viewCount(board.getViewCount())
                                          .createdAt(board.getCreatedAt())
                                          .updatedAt(board.getUpdatedAt())
                                          .deletedYn(board.getDeletedYn())
                                          .writerName(board.getUser() != null ? board.getUser().getName() : null)
                                          .writerEmail(board.getUser() != null ? board.getUser().getEmail() : null)
                                          .categoryName(board.getCategory() != null ? board.getCategory().getName() : null)
                                          .files(List.of())
                                          .hasImage(false)
                                          .replies(board.getReplies().stream()
                                                                     .map(reply -> BoardReplyResponseDTO.toDTO(reply))
                                                                     .toList())
                                          .replyCount((int) board.getReplies().stream() 
                                                                  .filter(r -> !Boolean.TRUE.equals(r.getDeletedYn()))
                                                                  .count())
                                          .build();
    }
}