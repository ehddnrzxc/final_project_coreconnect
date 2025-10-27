package com.goodee.coreconnect.board.dto.response;

import com.goodee.coreconnect.board.entity.BoardFile;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardFileResponseDTO {

    private Integer id;            // 파일 ID
    private String fileName;       // 파일 이름
    private String fileUrl;        // 파일 경로 (S3 등)
    private String fileExtension;  // 확장자
    private Long fileSize;         // 파일 크기
    private Boolean deletedYn;     // 삭제 여부

    /**
     * Entity -> DTO 변환
     */
    public static BoardFileResponseDTO toDTO(BoardFile file) {
        return BoardFileResponseDTO.builder()
                                    .id(file.getId())
                                    .fileName(file.getFileName())
                                    .fileUrl(file.getFileUrl())
                                    .fileExtension(file.getFileExtension())
                                    .fileSize(file.getFileSize())
                                    .deletedYn(file.getDeletedYn())
                                    .build();
    }
}
