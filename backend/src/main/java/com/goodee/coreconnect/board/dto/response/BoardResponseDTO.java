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
public class BoardResponseDTO {

    private Integer id;                 // 게시글 ID
    private String title;               // 제목
    private String content;             // 내용
    private Boolean noticeYn;           // 공지 여부
    private Boolean privateYn;          // 비공개 여부
    private Integer viewCount;          // 조회수
    private LocalDateTime createdAt;    // 작성일
    private LocalDateTime updatedAt;    // 수정일
    private Boolean deletedYn;          // 삭제 여부
    private String writerName;          // 작성자 이름
    private String categoryName;        // 카테고리 이름

    private List<BoardFileResponseDTO> files;    // 첨부파일 목록
    private List<BoardReplyResponseDTO> replies; // 댓글 목록

    /**
     * Entity -> DTO 변환
     */
    public static BoardResponseDTO toDTO(Board board) {
        return BoardResponseDTO.builder()
                .id(board.getId())
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
                                                        : null)
                .replies(board.getReplies() != null ? board.getReplies().stream()
                                                            .map(file -> BoardReplyResponseDTO.toDTO(file))
                                                            .collect(Collectors.toList())
                                                            : null)
                                                            .build();
    }
}
