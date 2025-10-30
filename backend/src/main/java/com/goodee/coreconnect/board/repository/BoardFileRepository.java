package com.goodee.coreconnect.board.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.board.entity.BoardFile;

public interface BoardFileRepository extends JpaRepository<BoardFile, Integer> {

    /**
     * 특정 게시글의 파일 목록 조회 (삭제 제외)
     * - 게시글 상세 페이지에서 첨부파일 리스트 출력용
     */
    List<BoardFile> findByBoardIdAndDeletedYnFalse(Integer boardId);

    /**
     * 단일 파일 조회 (삭제 제외)
     * - 파일 다운로드 또는 미리보기 URL 생성 시 사용
     */
    Optional<BoardFile> findByIdAndDeletedYnFalse(Integer fileId);

    /**
     * 특정 S3 ObjectKey로 파일 찾기 (삭제 제외)
     * - 이미지 미리보기용
     */
    Optional<BoardFile> findByS3ObjectKeyAndDeletedYnFalse(String s3ObjectKey);

    /**
     * 게시글 내 파일 존재 여부 확인
     * - 첨부파일이 있는지 여부만 확인할 때 사용
     */
    boolean existsByBoardIdAndDeletedYnFalse(Integer boardId);
}
