package com.goodee.coreconnect.approval.entity;

import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;

@Entity
@Getter
@Table(name = "approval_file")
public class File {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "approval_file_id")
  private Integer id;
  
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "doc_id", nullable = false)
  private Document document;
  
  @Column(name = "approval_file_name", nullable = false, length = 255)
  private String fileName;
  
  @Column(name = "approval_file_url", nullable = false, length = 500, unique = true)
  private String fileUrl;
  
  @Column(name = "approval_file_size", nullable = false)
  private long fileSize;
  
  protected File() {};
  
  /**
   * 생성 메소드
   * @param document
   * @param originalFileName
   * @param storedFilePath
   * @param fileSize
   * @return
   */
  public static File createFile(Document document, String fileName, String fileUrl, long fileSize) {
    File f = new File();
    Objects.requireNonNull(document, "파일이 속할 문서는 null일 수 없습니다.");
    f.document = document;
    f.fileName = fileName;
    f.fileUrl = fileUrl;
    f.fileSize = fileSize;
    document.getFiles().add(f);  // 양방향 연관관계 설정: Document의 files 리스트에도 File을 추가
    return f;
  }

}
