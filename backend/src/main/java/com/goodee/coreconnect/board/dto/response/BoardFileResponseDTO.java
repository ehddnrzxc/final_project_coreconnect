package com.goodee.coreconnect.board.dto.response;

import com.goodee.coreconnect.board.entity.BoardFile;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
/**
 * 파일 응답 DTO
 */
public class BoardFileResponseDTO {

    private Integer id;          
    private String fileName;     
    private Long fileSize;       
    private String s3ObjectKey;  
    private Boolean deletedYn;   

    /**
     * Entity -> DTO 변환
     */
    public static BoardFileResponseDTO toDTO(BoardFile file) {
        return BoardFileResponseDTO.builder()
                                    .id(file.getId())
                                    .fileName(file.getFileName())
                                    .fileSize(file.getFileSize())
                                    .s3ObjectKey(file.getS3ObjectKey())
                                    .deletedYn(file.getDeletedYn())
                                    .build();
    }
}
