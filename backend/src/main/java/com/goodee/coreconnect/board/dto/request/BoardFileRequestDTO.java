package com.goodee.coreconnect.board.dto.request;

import com.goodee.coreconnect.board.entity.Board;
import com.goodee.coreconnect.board.entity.BoardFile;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
/**
 * 파일 요청 DTO
 * - S3 업로드 후 반환된 key를 포함
 */
public class BoardFileRequestDTO {

    private Integer boardId;    
    private String fileName;    
    private Long fileSize;      
    private String s3ObjectKey; 

    /**
     * DTO -> Entity 변환
     */
    public BoardFile toEntity(Board board) {
        return BoardFile.createFile(board,
                                    this.fileName,
                                    this.fileSize,
                                    this.s3ObjectKey);
    }
}
