package com.goodee.coreconnect.board.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "board_file")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "board_file_id")
    private Integer id;

    @Column(name = "board_file_name", length = 50)
    private String fileName;

    @Column(name = "board_file_url", columnDefinition = "TEXT")
    private String fileUrl;

    @Column(name = "board_file_extension", length = 10)
    private String fileExtension;

    @Column(name = "board_file_size")
    private Double fileSize;

    @Column(name = "board_s3_object_key", columnDefinition = "TEXT")
    private String s3ObjectKey;

    // 게시판 연결
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id")
    private Board board;
}
