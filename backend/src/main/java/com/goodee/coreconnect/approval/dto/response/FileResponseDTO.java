package com.goodee.coreconnect.approval.dto.response;

import com.goodee.coreconnect.approval.entity.File;

import lombok.Builder;
import lombok.Getter;

/**
 * 첨부파일 정보를 반환하기 위한 공용 DTO
 */
@Getter
@Builder
public class FileResponseDTO {

  private Integer fileId;
  private String originalFileName;
  private long fileSize;

  //File 엔티티를 DTO로 변환하는 정적 메소드
  public static FileResponseDTO toDTO(File file) {
    return FileResponseDTO.builder()
        .fileId(file.getId())
        .originalFileName(file.getOriginalFileName())
        .fileSize(file.getFileSize())
        .build();
  }

}
