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
 * 파일 업로드 요청
 */
public class BoardFileRequestDTO {

    private Integer boardId;       // 게시글 ID
    private String fileName;       // 파일 이름
    private String fileUrl;        // S3 URL
    private String fileExtension;  // 확장자
    private Long fileSize;         // 크기(byte)
    private String s3ObjectKey;    // S3 내부 key

    /**
     * DTO -> Entity 변환
     */
    public BoardFile toEntity(Board board) {
        return BoardFile.createFile(board,
                                     this.fileName,
                                     this.fileUrl,
                                     this.fileExtension,
                                     this.fileSize,
                                     this.s3ObjectKey);
    }
}
