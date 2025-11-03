package com.goodee.coreconnect.board.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.goodee.coreconnect.board.entity.Board;
import lombok.*;

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
    private Boolean privateYn;         
    private Integer viewCount;         
    private LocalDateTime createdAt;   
    private LocalDateTime updatedAt;   
    private Boolean deletedYn;         
    private String writerName;         
    private String categoryName;       

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
                                          .privateYn(board.getPrivateYn())
                                          .viewCount(board.getViewCount())
                                          .createdAt(board.getCreatedAt())
                                          .updatedAt(board.getUpdatedAt())
                                          .deletedYn(board.getDeletedYn())
                                          .writerName(board.getUser() != null ? board.getUser().getName() : null)
                                          .categoryName(board.getCategory() != null ? board.getCategory().getName() : null)
                                          .files(board.getFiles() != null ? board.getFiles().stream()
                                                                                  .map(file -> BoardFileResponseDTO.toDTO(file))
                                                                                  .collect(Collectors.toList()) 
                                                                           : List.of())
                                          .replies(board.getReplies() != null ? board.getReplies().stream()
                                                                                      .map(reply -> BoardReplyResponseDTO.toDTO(reply))
                                                                                      .collect(Collectors.toList()) 
                                                                               : List.of())
                                          .build();
    }
}