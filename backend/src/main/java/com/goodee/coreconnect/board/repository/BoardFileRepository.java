package com.goodee.coreconnect.board.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.goodee.coreconnect.board.entity.BoardFile;

public interface BoardFileRepository extends JpaRepository<BoardFile, Integer> {

    // 게시글에 속한 파일 목록
    List<BoardFile> findFilesByBoardId(Integer boardId);

    // S3 ObjectKey로 파일 조회 (다운로드/삭제용)
    BoardFile findFileByS3ObjectKey(String s3ObjectKey);
}
