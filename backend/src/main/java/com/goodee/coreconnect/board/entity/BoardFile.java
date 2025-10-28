package com.goodee.coreconnect.board.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "board_file")
public class BoardFile {

    // ─────────────── 기본 속성 ───────────────
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "board_file_id")
    private Integer id;

    @Column(name = "board_file_name", length = 50, nullable = false)
    private String fileName;

    @Column(name = "board_file_size", nullable = false)
    private Long fileSize;

    @Column(name = "board_s3_object_key", columnDefinition = "TEXT")
    private String s3ObjectKey;

    @Column(name = "board_file_deleted_yn", nullable = false)
    private Boolean deletedYn = false;


    // ─────────────── 연관관계 매핑 ───────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;


    // ─────────────── 생성 메서드 ───────────────
    public static BoardFile createFile(Board board, String fileName, Long fileSize, String s3ObjectKey) {
        if (board == null) throw new IllegalArgumentException("게시글 정보는 반드시 필요합니다.");
        if (fileName == null || fileName.isBlank()) throw new IllegalArgumentException("파일명은 비어 있을 수 없습니다.");
        if (fileSize == null) throw new IllegalArgumentException("파일 크기는 반드시 입력되어야 합니다.");

        BoardFile file = new BoardFile();
        file.board = board;
        file.fileName = fileName;
        file.fileSize = fileSize;
        file.s3ObjectKey = s3ObjectKey;
        return file;
    }


    // ─────────────── 도메인 행위 ───────────────
    /** 파일 정보 수정 */
    public void updateFile(String fileName, Long fileSize, String s3ObjectKey) {
        if (fileName != null && !fileName.isBlank()) this.fileName = fileName;
        if (fileSize != null) this.fileSize = fileSize;
        if (s3ObjectKey != null && !s3ObjectKey.isBlank()) this.s3ObjectKey = s3ObjectKey;
    }

    /** Soft Delete */
    public void delete() {
        this.deletedYn = true;
    }
}
