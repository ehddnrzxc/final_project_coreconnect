package com.goodee.coreconnect.approval.entity;

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
@Table(name = "file")
public class File {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "file_id")
  private Integer id;
  
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "doc_id", nullable = false)
  private Document document;
  
  @Column(name = "original_file_name", nullable = false, length = 255)
  private String originalFileName;
  
  @Column(name = "stored_file_path", nullable = false, length = 500, unique = true)
  private String storedFilePath;
  
  @Column(name = "file_size", nullable = false)
  private long fileSize;
  
  protected File() {};
  
  public static File createFile(Document document, String originalFileName, String storedFilePath, long fileSize) {
    File f = new File();
    f.document = document;
    f.originalFileName = originalFileName;
    f.storedFilePath = storedFilePath;
    f.fileSize = fileSize;
    return f;
  }

}
